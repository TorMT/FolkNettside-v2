"""Staging HTTP acceptance tests are read-only and cannot fetch NTNU secrets."""
import importlib.util
import io
import unittest
from pathlib import Path
from urllib.request import Request

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "verify_ntnu_staging", ROOT / "scripts" / "verify_ntnu_staging.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

COMMIT = "a" * 40


class Response:
    status = 200

    def __init__(self, url, content):
        self.url, self.content = url, content

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def geturl(self):
        return self.url

    def read(self, n=-1):
        return self.content[:n]


class NtnuLiveReadOnlyTests(unittest.TestCase):
    def setUp(self):
        self.seen = []

    def fetcher(self, request: Request, timeout: int):
        self.assertEqual(timeout, 15)
        url = request.full_url
        self.assertTrue(url.startswith(mod.ORIGIN + "/"))
        self.assertNotIn("beskyttet", url.lower())
        self.seen.append(url)
        if url.endswith("build.txt"):
            value = (COMMIT + "\n").encode()
        elif url.endswith("app.js"):
            value = b'await loadContent();'
        elif url.endswith("ntnu-catalog.js"):
            value = b'function loadNTNUCatalog(){}'
        elif url.endswith("fusion_export_folknet.py"):
            value = b'import adsk.fusion'
        elif url.endswith("index.json"):
            value = b'{"1":{"dir":"1","files":[]}}'
        else:
            value = b'<!doctype html>'
        return Response(url, value)

    def test_http_smoke_does_not_request_any_course_bytes(self):
        result = mod.verify(commit=COMMIT, fetcher=self.fetcher)
        self.assertTrue(result["ready"], result)
        self.assertEqual(len(self.seen), len(mod.PATHS))
        self.assertTrue(all("index.json" in url or
            url.startswith(mod.ORIGIN + "/v2-staging/") for url in self.seen))
        self.assertEqual(result["build"], COMMIT)

    def test_deployment_mismatch_is_a_hard_failure(self):
        result = mod.verify(commit="b" * 40, fetcher=self.fetcher)
        self.assertFalse(result["ready"])
        self.assertTrue(any("does not match" in x["error"] for x in result["issues"]))

    def test_unexpected_redirect_is_rejected(self):
        def redirect(request, timeout):
            return Response("https://evil.example/phishing", b"hello")
        result = mod.verify(fetcher=redirect)
        self.assertFalse(result["ready"])
        self.assertEqual(len(result["issues"]), len(mod.PATHS))

    def test_invalid_expected_commit_is_not_accepted(self):
        with self.assertRaises(ValueError):
            mod.verify(commit="../other", fetcher=self.fetcher)


if __name__ == "__main__":
    unittest.main()
