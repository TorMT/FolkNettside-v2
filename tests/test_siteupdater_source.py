import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("v2_siteupdater", ROOT / "scripts" / "update_site.py")
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class SourceSelectionTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.folder.cleanup)
        self.tmp = Path(self.folder.name)
        self.manifest = self.tmp / "manifest.json"

    def test_fallback_when_no_manifest_exists(self):
        self.assertEqual(updater.manifest_source(self.manifest), updater.DEFAULT_SOURCE)

    def test_migrated_content_source_persists_across_rebuilds(self):
        course_root = self.tmp / "imported-semesters"
        course_root.mkdir()
        self.manifest.write_text(json.dumps({
            "schemaVersion": 2,
            "source": course_root.relative_to(ROOT).as_posix(),
            "semesters": []
        }), encoding="utf-8")
        self.assertEqual(updater.manifest_source(self.manifest), course_root.resolve())

    def test_missing_imported_source_is_not_silently_replaced_by_examples(self):
        self.manifest.write_text(json.dumps({"source": "site-content/semesters-not-present"}),
                                 encoding="utf-8")
        with self.assertRaises(ValueError):
            updater.manifest_source(self.manifest)

    def test_manifest_snapshot_restores_previous_metadata_without_touching_course_files(self):
        course_root = self.tmp / "imported-semesters"
        course_root.mkdir()
        meta = {
            "schemaVersion": 2,
            "source": course_root.relative_to(ROOT).as_posix(),
            "semesters": [{"id": 5, "courses": []}]
        }
        self.manifest.write_text(json.dumps(meta), encoding="utf-8")
        backup = updater.backup_manifest(self.manifest, self.tmp / "backups")
        self.assertTrue(backup.exists())
        newer = {**meta, "semesters": [{"id": 6, "courses": []}]}
        updater.write_manifest_atomic(self.manifest, newer)
        before_rollback = updater.restore_manifest(backup, self.manifest, self.tmp / "backups")
        self.assertEqual(json.loads(self.manifest.read_text()), meta)
        self.assertIsNotNone(before_rollback)
        self.assertEqual(json.loads(before_rollback.read_text()), newer)

    def test_restore_rejects_disallowed_resource_paths(self):
        course_root = self.tmp / "imported-semesters"
        course_root.mkdir()
        self.manifest.write_text(json.dumps({
            "source": course_root.relative_to(ROOT).as_posix(),
            "semesters": []
        }), encoding="utf-8")
        original = self.manifest.read_bytes()
        snapshot = self.tmp / "bad.json"
        snapshot.write_text(json.dumps({
            "source": course_root.relative_to(ROOT).as_posix(),
            "semesters": [{"courses": [{"resources": [
                {"path": "./site-content/private/credentials.json"}]}]}]
        }), encoding="utf-8")
        with self.assertRaises(ValueError):
            updater.restore_manifest(snapshot, self.manifest, self.tmp / "backups")
        self.assertEqual(self.manifest.read_bytes(), original)

    def test_outside_repository_source_is_rejected(self):
        for path in ("../../other-repo/semesters", "/etc/passwd"):
            self.manifest.write_text(json.dumps({"source": path}), encoding="utf-8")
            with self.assertRaises(ValueError):
                updater.manifest_source(self.manifest)


if __name__ == "__main__":
    unittest.main()
