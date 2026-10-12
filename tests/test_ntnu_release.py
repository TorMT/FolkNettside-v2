"""Code-only NTNU release backup, verification and non-destructive rollback."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
spec = importlib.util.spec_from_file_location(
    "ntnu_release", ROOT / "scripts" / "ntnu_release.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class NtnuReleaseTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.webroot = self.root / "mounted-ntnu"
        self.webroot.mkdir()
        self.v1 = self.webroot / "index.html"
        self.v1.write_bytes(b"V1 live unchanged")
        self.course = self.webroot / "semestre" / "5" / "Marin-Dynamikk"
        self.course.mkdir(parents=True)
        (self.course / "big.bin").write_bytes(b"V1 course original")
        self.stage = self.root / "build"
        for name, data in {
            "index.html": "V2 new index",
            "build.txt": "commit-v2",
            "src/app.js": "console.log('app-v2')",
            "data/content-manifest.json": '{"semesters":[]}',
            "scripts/fusion_export_folknet.py": "import adsk.fusion"
        }.items():
            f = self.stage / name
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(data, encoding="utf-8")
        self.target = self.webroot / "v2-staging"
        (self.target / "src").mkdir(parents=True)
        (self.target / "src" / "app.js").write_text("console.log('old')")
        (self.target / "index.html").write_text("OLD V2 home")
        self.backup = self.root / "outside-webroot" / "release-01"

    def test_prepare_is_read_only_and_backup_is_outside_webroot(self):
        report = release.deploy(self.stage, self.webroot, self.backup)
        self.assertFalse(report["applied"])
        self.assertEqual(report["changedFiles"], 5)
        self.assertFalse(self.backup.exists())
        self.assertEqual((self.target / "index.html").read_text(), "OLD V2 home")
        with self.assertRaises(ValueError):
            release.deploy(self.stage, self.webroot,
                           self.webroot / "unsafe-backup", apply=True)

    def test_apply_backups_and_rolls_back_only_the_changed_v2_files(self):
        report = release.deploy(self.stage, self.webroot, self.backup, apply=True)
        self.assertEqual(report["changedFiles"], 5)
        self.assertEqual(report["deletedFiles"], 0)
        self.assertEqual((self.target / "index.html").read_text(), "V2 new index")
        record = json.loads((self.backup / "release.json").read_text())
        self.assertEqual(record["status"], "applied")
        self.assertEqual(len(record["files"]), 5)
        self.assertEqual((self.backup / "originals" / "index.html").read_text(),
                         "OLD V2 home")
        self.assertEqual(self.v1.read_bytes(), b"V1 live unchanged")
        self.assertEqual((self.course / "big.bin").read_bytes(),
                         b"V1 course original")
        before = release.rollback(self.backup)
        self.assertFalse(before["applied"])
        release.rollback(self.backup, apply=True)
        self.assertEqual((self.target / "index.html").read_text(), "OLD V2 home")
        self.assertEqual((self.target / "src" / "app.js").read_text(),
                         "console.log('old')")
        self.assertFalse((self.target / "scripts" / "fusion_export_folknet.py").exists())
        self.assertEqual(self.v1.read_bytes(), b"V1 live unchanged")
        self.assertEqual((self.course / "big.bin").read_bytes(),
                         b"V1 course original")

    def test_rollback_fails_closed_if_v2_changes_after_deployment(self):
        release.deploy(self.stage, self.webroot, self.backup, apply=True)
        (self.target / "src" / "app.js").write_text("new edits after release")
        with self.assertRaisesRegex(ValueError, "conflict"):
            release.rollback(self.backup, apply=True)
        self.assertEqual((self.target / "src" / "app.js").read_text(),
                         "new edits after release")
        self.assertEqual((self.target / "index.html").read_text(), "V2 new index")

    def test_missing_backup_and_unsafe_target_are_rejected(self):
        release.deploy(self.stage, self.webroot, self.backup, apply=True)
        (self.backup / "originals" / "index.html").unlink()
        with self.assertRaisesRegex(ValueError, "Missing or modified"):
            release.rollback(self.backup, apply=True)
        self.assertEqual((self.target / "index.html").read_text(), "V2 new index")


if __name__ == "__main__":
    unittest.main()
