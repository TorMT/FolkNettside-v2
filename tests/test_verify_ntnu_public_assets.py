import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
spec = importlib.util.spec_from_file_location(
    "v2_public_verify", ROOT / "scripts" / "verify_ntnu_public_assets.py")
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


class VerifyStagedFilesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.approved = self.base / "reviewed"
        self.stage = self.base / "package"
        self.relative = Path("site-content/semesters/5/TMR4182/Ovinger/lab.pdf")
        original = self.approved / self.relative
        original.parent.mkdir(parents=True)
        original.write_bytes(b"test_public_material")
        copy = self.stage / self.relative
        copy.parent.mkdir(parents=True)
        copy.write_bytes(original.read_bytes())
        self.manifest = {
            "source": "site-content/semesters",
            "semesters": [{"id": 5, "courses": [{
                "code": "TMR4182", "resources": [{
                    "source": "site",
                    "path": "./" + self.relative.as_posix(),
                    "name": "lab.pdf"
                }]
            }]}]
        }
        self.path = self.base / "approved-manifest.json"
        self.path.write_text(json.dumps(self.manifest))
        (self.stage / "data").mkdir()
        (self.stage / "data" / "content-manifest.json").write_text(
            json.dumps(self.manifest))

    def check(self):
        return v.verify_public_assets(self.path, self.approved, self.stage)

    def test_exact_copy_matches_sha256(self):
        report = self.check()
        self.assertTrue(report["allApprovedFilesMatch"])
        self.assertEqual(report["verified"], 1)
        self.assertEqual(report["approved"], 1)
        self.assertEqual(report["verifiedFiles"][0]["sha256"],
                         v.sha256_file(self.approved / self.relative))

    def test_changed_content_same_bytes_fails(self):
        (self.stage / self.relative).write_bytes(b"X" * len(b"test_public_material"))
        report = self.check()
        self.assertFalse(report["allApprovedFilesMatch"])
        self.assertEqual(report["errors"][0]["status"], "sha256_mismatch")

    def test_partial_copy_fails(self):
        (self.stage / self.relative).write_bytes(b"short")
        self.assertEqual(self.check()["errors"][0]["status"], "size_mismatch")
        (self.stage / self.relative).unlink()
        self.assertEqual(self.check()["errors"][0]["status"], "missing_or_unsafe")

    def test_modified_manifest_fails_even_if_file_exists(self):
        other = dict(self.manifest)
        other["source"] = "examples/semesters"
        (self.stage / "data" / "content-manifest.json").write_text(json.dumps(other))
        with self.assertRaisesRegex(ValueError, "differs"):
            self.check()

    def test_staged_symlink_fails_closed(self):
        (self.stage / self.relative).unlink()
        try:
            (self.stage / self.relative).symlink_to(self.approved / self.relative)
        except (NotImplementedError, OSError):
            self.skipTest("Symlinks unsupported")
        self.assertEqual(self.check()["errors"][0]["status"], "missing_or_unsafe")


if __name__ == "__main__":
    unittest.main()
