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
    def test_credentialed_external_urls_are_rejected_without_echoing_values(self):
        unsafe=[
            "http://example.org/watch?v=123",
            "javascript:alert(1)",
            "https://user:pass@example.org/file.pdf",
            "https://example.org/file.pdf?api_key=PRIVATE_EXAMPLE",
            "https://example.org/watch?access%5Ftoken=PRIVATE_EXAMPLE",
            "https://example.org/watch#refresh_token=PRIVATE_EXAMPLE",
            "https://example.org/watch?session-token=PRIVATE_EXAMPLE",
            "https://example.org/watch\\n?x=1",
            "https://example.org:bad-port/file",
        ]
        for url in unsafe:
            with self.subTest(url=url):
                self.assertTrue(guard.external_url_violations(url))
                manifest={"semesters":[{"courses":[{"resources":[
                    {"source":"remote","path":url,"url":url}]}]}]}
                issues=guard.validate_manifest(manifest)
                self.assertEqual(len(issues),1)
                self.assertEqual(issues[0][0],"<external URL redacted>")
                self.assertNotIn("PRIVATE_EXAMPLE",repr(issues))

    def test_noncredentialed_external_links_and_local_paths_remain_valid(self):
        for url in [
            "https://example.org/watch?v=123&start=45#chapter",
            "https://supavoxel.com/embed/cmv1etjl70023t67ha56kzmfh",
            "https://example.org/files/%C3%98ving%201.pdf",
        ]:
            self.assertEqual(guard.external_url_violations(url),[])
            self.assertEqual(guard.resource_violations(url),[])
        self.assertEqual(guard.resource_violations(
            "./examples/semesters/5/TMR4182/Kok/lecture.pdf"),[])

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
