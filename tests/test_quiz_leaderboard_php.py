#!/usr/bin/env python3
"""Live, disposable HTTP integration tests for the *disabled* V2 PHP quiz backend.

Creates private temporary quiz/storage directories and an isolated PHP server.
Never contacts NTNU, uses no real users and never writes into the repository.
"""
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
PHP_SOURCE = ROOT / "server" / "quiz-leaderboard.php"


@unittest.skipUnless(shutil.which("php"), "PHP CLI is needed for integration tests")
class QuizLeaderboardPHPServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="folk-v2-php-test-")
        cls.base = Path(cls.tmp.name)
        cls.public = cls.base / "www"
        cls.private = cls.base / "state"
        cls.quiz_dir = cls.base / "semestre" / "1" / "testquiz" / "quiz"
        (cls.public / "api").mkdir(parents=True)
        cls.private.mkdir()
        cls.quiz_dir.mkdir(parents=True)
        shutil.copyfile(PHP_SOURCE, cls.public / "api" / "quiz-leaderboard.php")
        (cls.quiz_dir / "quiz.json").write_text(
            json.dumps({
                "title": "Integration fixture",
                "questions": [
                    {"text": "First", "options": ["A", "B"], "answer": [1]},
                    {"text": "Second", "options": ["A", "B", "C"], "answer": [0, 2]}
                ]
            }), encoding="utf-8"
        )
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        cls.origin = f"http://127.0.0.1:{cls.port}"
        cls.endpoint = cls.origin + "/api/quiz-leaderboard.php"
        env = {
            **os.environ,
            "FOLK_QUIZ_ROOT": str(cls.base / "semestre"),
            "FOLK_LEADERBOARD_DIR": str(cls.private),
            "FOLK_LEADERBOARD_KEY": "test-only-random-key-that-is-never-deployed-012345",
            "FOLK_LEADERBOARD_QUIZZES": "1/testquiz",
        }
        cls.proc = subprocess.Popen(
            ["php", "-S", f"127.0.0.1:{cls.port}", "-t", str(cls.public)],
            env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        try:
            for _ in range(40):
                if cls.proc.poll() is not None:
                    raise RuntimeError("Isolated PHP test server exited before readiness")
                try:
                    with urlopen(cls.endpoint + "?quiz=1%2Ftestquiz", timeout=1):
                        break
                except (URLError, OSError):
                    time.sleep(0.1)
            else:
                raise RuntimeError("Isolated PHP test server did not start")
        except Exception:
            cls.proc.terminate()
            cls.proc.wait(timeout=5)
            cls.tmp.cleanup()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
            cls.proc.wait(timeout=5)
        cls.tmp.cleanup()

    def request(self, method="GET", quiz="1/testquiz", payload=None, origin=None,
                content_type="application/json"):
        url = self.endpoint + ("?quiz=" + quote(quiz, safe="") if method == "GET" else "")
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {"Accept": "application/json"}
        if method == "POST":
            headers["Content-Type"] = content_type
            headers["Origin"] = self.origin if origin is None else origin
        req = Request(url, method=method, data=body, headers=headers)
        try:
            with urlopen(req, timeout=5) as response:
                return response.status, json.loads(response.read())
        except HTTPError as error:
            return error.code, json.loads(error.read())

    @staticmethod
    def answer_payload(nickname="TestStudent", first=1, second=None):
        return {
            "quiz": "1/testquiz",
            "nickname": nickname,
            "answers": [
                {"id": "q1", "selected": first},
                {"id": "q2", "selected": [0, 2] if second is None else second},
            ],
            "correct": 999999,  # Forged score must have NO influence.
        }

    def test_01_only_reviewed_ids_are_accessible(self):
        code, value = self.request()
        self.assertEqual(code, 200)
        self.assertEqual(value["entries"], [])
        for name in ["1/not-reviewed", "../testquiz", "1/testquiz/../../secret"]:
            self.assertEqual(self.request(quiz=name)[0], 404)

    def test_02_reject_cross_origin_and_unexpected_payload(self):
        self.assertEqual(
            self.request("POST", payload=self.answer_payload(),
                         origin="https://other.example")[0], 403)
        self.assertEqual(
            self.request("POST", payload=self.answer_payload(),
                         content_type="text/plain")[0], 403)
        self.assertEqual(
            self.request("POST", payload=self.answer_payload("<script>"))[0], 422)
        self.assertEqual(
            self.request("POST", payload=self.answer_payload(first=200))[0], 422)
        missing = self.answer_payload()
        missing["answers"] = missing["answers"][:1]
        self.assertEqual(self.request("POST", payload=missing)[0], 422)

    def test_03_score_is_calculated_from_real_quiz_answer_keys(self):
        code, result = self.request("POST", payload=self.answer_payload())
        self.assertEqual(code, 200, result)
        self.assertEqual(result["quiz"], "1/testquiz")
        by_name = {e["nickname"]: e for e in result["entries"]}
        self.assertEqual(by_name["TestStudent"]["correct"], 2)
        self.assertEqual(by_name["TestStudent"]["total"], 2)
        self.assertNotIn("999999", json.dumps(result))

        # A wrong submitted selection MUST be scored on the server.
        code, result = self.request(
            "POST", payload=self.answer_payload("Student2", first=0))
        self.assertEqual(code, 200, result)
        by_name = {e["nickname"]: e for e in result["entries"]}
        self.assertEqual(by_name["Student2"]["correct"], 1)
        self.assertEqual(by_name["TestStudent"]["correct"], 2)

        # Leaderboard is actually persisted on disk and exposed by GET.
        code, result = self.request()
        self.assertEqual(code, 200)
        self.assertEqual(result["entries"][0]["nickname"], "TestStudent")
        self.assertTrue(list(self.private.glob("*.json")))
        self.assertFalse((self.public / "state").exists())

    def test_04_rate_limit_and_no_private_directory_leakage(self):
        self.assertEqual(
            self.request("POST", payload=self.answer_payload("Student3"))[0], 200)
        code, result = self.request("POST", payload=self.answer_payload("Student4"))
        self.assertEqual(code, 429, result)
        self.assertIn("Too many submissions", result["error"])
        self.assertEqual(self.request(quiz="1/testquiz")[0], 200)

    def test_05_script_does_not_expose_php_source_or_secret_to_clients(self):
        _, result = self.request()
        raw = json.dumps(result)
        self.assertNotIn("FOLK_LEADERBOARD_KEY", raw)
        self.assertNotIn(str(self.private), raw)
        self.assertNotIn("REMOTE_ADDR", raw)


if __name__ == "__main__":
    unittest.main()
