"""Code-only NTNU deployment: never copy semester files or alter V1 root."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "publish_ntnu_staging", ROOT / "scripts" / "publish_ntnu_staging.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class NtnuStagingSyncTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.webroot = root / "verified-ntnu-root"
        self.webroot.mkdir()
        (self.webroot / "index.html").write_text("DO NOT OVERWRITE V1")
        self.course = self.webroot / "semestre" / "5" / "Marin-Dynamikk"
        self.course.mkdir(parents=True)
        (self.course / "index.json").write_text('{"files":["big.pdf"]}')
        (self.course / "big.pdf").write_bytes(b"x" * 4096)
        self.stage = root / "safe-build"
        for file, data in {
            "index.html": "NEW V2",
            "build.txt": "test-sha",
            "src/app.js": "console.log('V2')",
            "data/content-manifest.json": '{"semesters":[]}',
            "scripts/fusion_export_folknet.py": "import adsk.fusion"
        }.items():
            path = self.stage / file
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(data)

    def test_dry_run_does_not_write_to_v1_or_v2(self):
        report = mod.publish(self.stage, self.webroot)
        self.assertEqual(report["changedFiles"], 5)
        self.assertFalse(report["applied"])
        self.assertFalse((self.webroot / "v2-staging").exists())
        self.assertEqual((self.webroot / "index.html").read_text(),
                         "DO NOT OVERWRITE V1")

    def test_apply_copies_only_code_and_is_idempotent(self):
        first = mod.publish(self.stage, self.webroot, apply=True)
        self.assertEqual(first["changedFiles"], 5)
        self.assertEqual(first["deletedFiles"], 0)
        self.assertEqual((self.webroot / "v2-staging" / "index.html").read_text(),
                         "NEW V2")
        self.assertEqual((self.webroot / "index.html").read_text(),
                         "DO NOT OVERWRITE V1")
        self.assertEqual((self.course / "big.pdf").stat().st_size, 4096)
        self.assertFalse((self.webroot / "v2-staging" / "semestre").exists())
        again = mod.publish(self.stage, self.webroot, apply=True)
        self.assertEqual(again["changedFiles"], 0)
        self.assertFalse((self.webroot / "v2-staging" / ".git").exists())
        legacy = self.webroot / "v2-staging" / "old-but-untouched.txt"
        legacy.write_text("keep")
        mod.publish(self.stage, self.webroot, apply=True)
        self.assertEqual(legacy.read_text(), "keep")

    def test_refuses_protected_dirs_and_server_config(self):
        for path in ["semestre/5/fake.pdf", ".git/config", "private/data.json",
                     ".htaccess", "includes/secrets/config.json", "backend.php"]:
            blocked = self.stage / path
            blocked.parent.mkdir(parents=True, exist_ok=True)
            blocked.write_text("forbidden")
            with self.assertRaises(ValueError):
                mod.publish(self.stage, self.webroot, apply=True)
            blocked.unlink()

    def test_refuses_unverified_webroot_and_linked_targets(self):
        root = Path(self.temp.name)
        other = root / "wrong-webroot"
        other.mkdir()
        with self.assertRaisesRegex(ValueError, "verified NTNU"):
            mod.publish(self.stage, other, apply=True)
        (self.webroot / "v2-staging").symlink_to(self.course, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "symlink"):
            mod.publish(self.stage, self.webroot, apply=True)


if __name__ == "__main__":
    unittest.main()
