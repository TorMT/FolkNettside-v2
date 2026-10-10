"""Offline NTNU package safety: no course archive or server secrets needed."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
spec = importlib.util.spec_from_file_location("ntnu_pack", ROOT / "scripts" / "build_ntnu_staging.py")
packer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packer)


class NtnuPackageTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.base = Path(self.folder.name)
        self.approved = self.base / "reviewed"
        self.course = self.approved / "site-content" / "semesters" / "5" / "TMR4182"
        self.course.mkdir(parents=True)
        (self.course / "Lecture.pdf").write_bytes(b"approved public lecture file")
        (self.course / "Beskyttet").mkdir()
        (self.course / "Beskyttet" / "no.pdf").write_bytes(b"never deploy")
        self.manifest = {
            "source": "site-content/semesters",
            "semesters": [{"id": 5, "courses": [{
                "code": "TMR4182",
                "resources": [{"path": "./site-content/semesters/5/TMR4182/Lecture.pdf"}]
            }]}]
        }
        self.manifest_path = self.base / "manifest.json"
        self.write_manifest()
        self.output = self.base / "staged-ntnu"

    def write_manifest(self):
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")

    def test_public_only_staging_packages_explicitly_approved_files(self):
        result = packer.build_ntnu_staging(
            "v2-safe-test", self.output, self.manifest_path, self.approved)
        self.assertEqual(result["publicCourseFiles"], 1)
        self.assertTrue((self.output / "index.html").is_file())
        self.assertTrue((self.output / "src/vendor/coolprop/coolprop.wasm").is_file())
        self.assertTrue((self.output / "site-content/semesters/5/TMR4182/Lecture.pdf").is_file())
        self.assertFalse((self.output / "site-content/semesters/5/TMR4182/Beskyttet").exists())
        self.assertFalse((self.output / "includes/matpris/api.php").exists())
        self.assertFalse((self.output / ".htpasswd").exists())
        service = json.loads((self.output / packer.SERVICE_CONFIG_PATH).read_text())
        self.assertFalse(service["matpris"]["enabled"])
        self.assertEqual(
            json.loads((self.output / "data/content-manifest.json").read_text())["source"],
            "site-content/semesters"
        )

    def test_php_bundle_must_be_explicitly_enabled(self):
        result = packer.build_ntnu_staging(
            "php-explicit", self.output, enable_matpris=True)
        self.assertTrue(result["matprisPhpBundled"])
        source = (self.output / "includes/matpris/api.php").read_text()
        self.assertIn("KASSALAPP_API_KEY", source)
        self.assertNotIn("secret-value-from-test", source)
        service = json.loads((self.output / packer.SERVICE_CONFIG_PATH).read_text())
        self.assertEqual(service["matpris"]["endpoint"], "./includes/matpris/api.php")
        self.assertTrue(service["matpris"]["enabled"])

    def test_protected_path_is_never_approved(self):
        self.manifest["semesters"][0]["courses"][0]["resources"].append(
            {"path": "./site-content/semesters/5/TMR4182/Beskyttet/no.pdf"})
        self.write_manifest()
        with self.assertRaises(ValueError):
            packer.build_ntnu_staging("unsafe", self.output,
                                     self.manifest_path, self.approved)
        self.assertFalse(self.output.exists())

    def test_empty_root_not_implicitly_imported_from_v1(self):
        with self.assertRaises(ValueError):
            packer.build_ntnu_staging("missing", self.output, self.manifest_path,
                                     self.base / "nonexistent")
        self.assertFalse(self.output.exists())

    def test_invalid_unsafe_paths_and_scheme_are_rejected(self):
        unsafe = [
            "./site-content/semesters/5/TMR4182/../private/answers.pdf",
            "./site-content/semesters/5/TMR4182/.env",
            "./site-content/semesters/5/TMR4182/Extra(beskyttet)/svar.pdf",
            "./site-content/semesters/5/TMR4182/sneaky.php",
            "./site-content/semesters/5/TMR4182/test.pdf?key=abc",
            "./examples/semesters/5/TMR4182/fixture.pdf",
            "javascript:alert(1)",
            "file:///etc/passwd",
            "site-content/semesters/5/TMR4182/Lecture.pdf"
        ]
        for path in unsafe:
            with self.subTest(path=path), self.assertRaises(ValueError):
                packer.resource_relative_path(path)
        self.assertIsNone(packer.resource_relative_path("https://www.youtube.com/watch?v=abcdefghijk"))

    def test_unmarked_output_is_not_deleted(self):
        self.output.mkdir()
        sentinel = self.output / "important.txt"
        sentinel.write_text("keep")
        with self.assertRaises(ValueError):
            packer.build_ntnu_staging("unsafe", self.output)
        self.assertEqual(sentinel.read_text(), "keep")

    def test_symlinked_course_file_is_rejected(self):
        source = self.course / "Lecture.pdf"
        link = self.course / "Linked.pdf"
        try:
            link.symlink_to(source)
        except (OSError, NotImplementedError):
            self.skipTest("Symlinks not permitted on this platform")
        self.manifest["semesters"][0]["courses"][0]["resources"] = [{
            "path": "./site-content/semesters/5/TMR4182/Linked.pdf"}]
        self.write_manifest()
        with self.assertRaises(ValueError):
            packer.approved_files(self.manifest, self.approved)


if __name__ == "__main__":
    unittest.main()
