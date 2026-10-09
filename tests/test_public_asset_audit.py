import importlib.util
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("public_guard",ROOT/"scripts"/"audit_public_assets.py")
guard=importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

class PublicResourceTests(unittest.TestCase):
    def test_protected_course_folders_never_become_public_assets(self):
        for path in ["./examples/semesters/5/TMR4182/Beskyttet/answers.pdf",
          "./examples/semesters/5/TMR4182/protected/solution.ipynb",
          "./site-content/Private/medical.json",
          "examples/semesters/5/TMR4182/foo/service-account.json"]:
            self.assertTrue(guard.resource_violations(path),path)
    def test_public_assets_are_allowed(self):
        for path in ["./examples/semesters/5/TMR4182/Kok/notes.pdf",
          "./examples/semesters/5/TMR4182/Forelesninger/lecture-1.pdf",
          "https://example.org/links-only"]:
            self.assertEqual(guard.resource_violations(path),[],path)
    def test_private_manifest_entry_is_rejected(self):
        manifest={"semesters":[{"courses":[{"resources":[
          {"path":"./examples/semesters/3/MAT/Beskyttet/fasit.pdf"}]}]}]}
        self.assertEqual(len(guard.validate_manifest(manifest)),1)

if __name__=="__main__":unittest.main()
