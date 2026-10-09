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


    def test_static_source_audit_rejects_unlisted_credential_files(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            path=Path(folder)/"service-account.json"
            path.write_text("{}",encoding="utf-8")
            issues=guard.validate_sources([Path(folder)])
            self.assertTrue(any("credential-like" in issue for _,issue in issues))

    def test_static_source_audit_rejects_symlink_before_copy(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            path=Path(folder)
            target=path/"legitimate.txt"
            target.write_text("test",encoding="utf-8")
            link=path/"linked.txt"
            try:
                link.symlink_to(target)
            except (OSError,NotImplementedError):
                self.skipTest("Symlinks not available")
            issues=guard.validate_sources([path])
            self.assertTrue(any("symbolic link" in issue for _,issue in issues))

if __name__=="__main__":unittest.main()
