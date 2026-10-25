"""Fail-closed public route collision tests for the metadata-only V2 SiteUpdater."""
import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "v2_siteupdater_route_check", ROOT / "scripts" / "update_site.py")
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class RouteCollisionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.source = self.base / "semesters"
        self.output = self.base / "content-manifest.json"
        self.backups = self.base / "backup"
        self.write_course("5", "marine-a", "TMR4182")

    def write_course(self, semester, folder, code):
        path = self.source / semester / folder
        path.mkdir(parents=True, exist_ok=True)
        (path / "course.json").write_text(
            json.dumps({"code": code, "title": "Public course"}), encoding="utf-8")
        (path / "notes.txt").write_text("public fixture", encoding="utf-8")

    def invoke(self, *flags):
        argv = ["update_site.py", "--source", str(self.source),
                "--output", str(self.output),
                "--backup-dir", str(self.backups), *flags]
        with patch("sys.argv", argv), redirect_stdout(io.StringIO()), \
                patch("sys.stderr", new=io.StringIO()):
            return site.main()

    def test_casefold_duplicate_course_codes_stop_full_and_semester_scans(self):
        self.assertEqual(self.invoke(), 0)
        before = self.output.read_bytes()
        self.write_course("5", "marine-b", "tmr4182")
        for options in [(), ("--semester", "5"), ("--dry-run",),
                        ("--semester", "5", "--dry-run")]:
            with self.subTest(options=options):
                self.assertEqual(self.invoke(*options), 2)
                self.assertEqual(self.output.read_bytes(), before)
                self.assertFalse(list(self.backups.glob("*")))

    def test_noncanonical_semester_alias_cannot_duplicate_course_view(self):
        self.assertEqual(self.invoke(), 0)
        before = self.output.read_bytes()
        self.write_course("05", "alias", "TMR5000")
        self.assertEqual(self.invoke(), 2)
        self.assertEqual(self.output.read_bytes(), before)

    def test_distinct_semesters_can_reuse_codes(self):
        self.write_course("3", "another", "tmr4182")
        scanned = site.build_full_manifest(self.source)
        self.assertEqual([x["id"] for x in scanned["semesters"]], [3, 5])
        self.assertEqual(self.invoke(), 0)
        self.assertEqual(len(site.load_json(self.output)["semesters"]), 2)

    def test_existing_duplicate_semesters_or_codes_block_scoped_merge(self):
        original = site.build_full_manifest(self.source)
        for mutation in ("duplicate-semester", "duplicate-course"):
            unsafe = json.loads(json.dumps(original))
            if mutation == "duplicate-semester":
                unsafe["semesters"].append(json.loads(json.dumps(unsafe["semesters"][0])))
            else:
                unsafe["semesters"][0]["courses"].append({
                    "code": "tmr4182", "resources": []})
            with self.subTest(mutation=mutation):
                self.output.write_text(json.dumps(unsafe), encoding="utf-8")
                before = self.output.read_bytes()
                self.assertEqual(self.invoke("--semester", "5", "--course", "marine-a"), 2)
                self.assertEqual(self.output.read_bytes(), before)

    def test_restore_rejects_ambiguous_snapshot_without_changes(self):
        self.assertEqual(self.invoke(), 0)
        before = self.output.read_bytes()
        snapshot = site.load_json(self.output)
        snapshot["semesters"][0]["courses"].append({"code": "tmr4182", "resources": []})
        bad = self.base / "snapshot.json"
        bad.write_text(json.dumps(snapshot), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Duplicate course route"):
            site.restore_manifest(bad, self.output, self.backups)
        self.assertEqual(self.output.read_bytes(), before)
        self.assertFalse(list(self.backups.glob("*")))


if __name__ == "__main__":
    unittest.main()
