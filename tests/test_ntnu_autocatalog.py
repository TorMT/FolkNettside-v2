"""Local NTNU auto-index candidate: privacy and metadata-only regressions."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "preview_ntnu_autocatalog", ROOT / "scripts" / "preview_ntnu_autocatalog.py")
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)


class NtnuAutoIndexTests(unittest.TestCase):
    def setUp(self):
        context = tempfile.TemporaryDirectory()
        self.addCleanup(context.cleanup)
        self.root = Path(context.name)
        self.webroot = self.root / "ntnu-original"
        self.webroot.mkdir()
        (self.webroot / "index.html").write_text("LIVE V1. NEVER MODIFY", encoding="utf-8")
        self.semester = self.webroot / "semestre" / "5"
        self.semester.mkdir(parents=True)
        self.course = self.semester / "Marin-Dynamikk"
        self.course.mkdir()
        (self.semester / "index.json").write_text(json.dumps({
            "Marin-Dynamikk":{"dir":"Marin-Dynamikk","beskyttet":False,"files":[]},
            "Hemmelig":{"dir":"Hemmelig","beskyttet":True,"files":["grades.pdf"]}
        }), encoding="utf-8")
        (self.course / "index.json").write_text(json.dumps({
            "welcome":"/img/default.svg",
            "filer":{"dir":"filer","beskyttet":False,"files":[]},
            "quiz":"quiz/quiz.json"
        }), encoding="utf-8")
        (self.course / "filer" / "Øving 1").mkdir(parents=True)
        (self.course / "quiz").mkdir()
        (self.course / "filer" / "Øving 1" / "løsningsforslag.py").write_bytes(b"abc")
        (self.course / "filer" / "Oeving-2.pdf").write_bytes(b"%PDF fake")
        (self.course / "quiz" / "quiz.json").write_text('{"questions":[]}', encoding="utf-8")
        (self.course / "filer" / ".env").write_text("secret", encoding="utf-8")
        (self.course / "filer" / "passord-data.txt").write_text("secret", encoding="utf-8")
        (self.course / "filer" / "beskyttet").mkdir()
        (self.course / "filer" / "beskyttet" / "grades.pdf").write_bytes(b"secret")
        (self.course / "filer" / "symlinked.py").symlink_to(self.course / "filer" / "Øving 1" / "løsningsforslag.py")
        self.allowlist = {"publicCourses":[{
            "semester":5,"slug":"Marin-Dynamikk","sections":["filer","quiz"],
            "title":"Marin dynamikk"
        }]}

    def test_preview_scans_only_reviewed_public_and_never_writes_ntnu(self):
        result = scan.build_catalog(self.webroot, self.allowlist)
        course = result["semesters"][0]["courses"][0]
        self.assertEqual(len(course["resources"]), 3)
        self.assertTrue(any("Øving 1" in x["relativePath"] for
                            x in course["resources"]))
        self.assertTrue(any(x["kind"]=="QUIZ" for x in course["resources"]))
        serialized = json.dumps(result,ensure_ascii=False)
        self.assertNotIn("passord", serialized)
        self.assertNotIn("grades.pdf", serialized)
        self.assertNotIn("symlinked.py", serialized)
        self.assertIn("%C3%98ving%201", serialized)
        self.assertEqual((self.webroot / "index.html").read_text(), "LIVE V1. NEVER MODIFY")
        self.assertEqual(json.loads((self.semester / "index.json").read_text())
                         ["Marin-Dynamikk"]["files"], [])

    def test_apply_to_public_webroot_is_refused_and_external_preview_idempotent(self):
        catalog = scan.build_catalog(self.webroot, self.allowlist)
        with self.assertRaisesRegex(ValueError,"outside NTNU"):
            scan.save_preview(catalog,self.webroot,self.webroot/"v2-staging"/"data.json")
        external = self.root / "catalog.json"
        first = scan.save_preview(catalog,self.webroot,external)
        self.assertTrue(first["changed"])
        second = scan.save_preview(catalog,self.webroot,external)
        self.assertFalse(second["changed"])
        self.assertEqual(json.loads(external.read_text())["semesters"][0]["id"], 5)

    def test_protected_course_and_section_never_whitelisted_by_filename(self):
        private_allow = {"publicCourses":[{"semester":5,"slug":"Hemmelig",
                                             "sections":["filer"]}]}
        with self.assertRaisesRegex(ValueError,"explicitly public"):
            scan.build_catalog(self.webroot,private_allow)
        (self.course/"index.json").write_text(json.dumps({
            "filer":{"dir":"filer","beskyttet":True,"files":[]},
            "quiz":"quiz/quiz.json"
        }),encoding="utf-8")
        with self.assertRaisesRegex(ValueError,"explicitly public"):
            scan.build_catalog(self.webroot,self.allowlist)

    def test_reject_traversal_new_unknown_course_and_unapproved_sections(self):
        for bad in [
            {"semester":5,"slug":"../bad","sections":["filer"]},
            {"semester":5,"slug":"NotReviewed","sections":["filer"]},
            {"semester":5,"slug":"Marin-Dynamikk","sections":["private"]},
            {"semester":5,"slug":"Marin-Dynamikk","sections":["filer","filer"]},
        ]:
            with self.assertRaises(ValueError):
                scan.build_catalog(self.webroot,{"publicCourses":[bad]})

    def test_missing_mount_has_no_local_output_fallback(self):
        with self.assertRaises((ValueError,FileNotFoundError)):
            scan.build_catalog(self.root/"non-existent",self.allowlist)


if __name__=="__main__":
    unittest.main()
