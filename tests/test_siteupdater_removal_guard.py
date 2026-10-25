"""No accidental deletion of indexed public course references in SiteUpdater."""
import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "v2_siteupdater_removals", ROOT / "scripts" / "update_site.py")
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class SourceLossGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.source = self.home / "semesters"
        self.output = self.home / "manifest.json"
        self.backup = self.home / "backups"
        self.course_a = self.make_course("5", "Marine-Dynamikk", "TMR4182")
        self.course_b = self.make_course("5", "Marine-Maskineri", "TMR4010")
        self.course_other = self.make_course("3", "Statikk", "TKT4123")
        self.assertEqual(self.invoke(), 0)

    def make_course(self, semester, name, code):
        folder = self.source / semester / name
        (folder / "Oving" / "Nested").mkdir(parents=True)
        (folder / "course.json").write_text(
            json.dumps({"code": code, "title": name}), encoding="utf-8")
        (folder / "Oving" / "Nested" / "Øving 1.pdf").write_bytes(b"%PDF-1.7")
        (folder / "Oving" / "Nested" / "solver.py").write_text(
            "print(42)", encoding="utf-8")
        return folder

    def invoke(self, *flags):
        args = ["update_site.py", "--source", str(self.source),
                "--output", str(self.output),
                "--backup-dir", str(self.backup), *flags]
        out = io.StringIO()
        err = io.StringIO()
        with patch("sys.argv", args), redirect_stdout(out), \
                patch("sys.stderr", err):
            status = site.main()
        return status

    def assert_refused_without_writing(self, *flags):
        original = self.output.read_bytes()
        for extras in [(), ("--dry-run",), ("--check",)]:
            with self.subTest(flags=flags, extras=extras):
                if "--check" in extras and flags:
                    continue  # --check is only legal for a full scan.
                self.assertEqual(self.invoke(*flags, *extras), 2)
                self.assertEqual(self.output.read_bytes(), original)
                self.assertFalse(list(self.backup.glob("*")))

    def test_entire_missing_semester_or_course_fails_closed_for_full_update(self):
        shutil.rmtree(self.source / "3")
        self.assert_refused_without_writing()

    def test_missing_course_in_existing_semester_fails_for_full_and_scoped(self):
        shutil.rmtree(self.course_b)
        self.assert_refused_without_writing()
        self.assert_refused_without_writing("--semester", "5")

    def test_partially_copied_nested_files_fails_even_if_course_survives(self):
        (self.course_a / "Oving" / "Nested" / "solver.py").unlink()
        self.assert_refused_without_writing()
        self.assert_refused_without_writing("--semester", "5")
        self.assert_refused_without_writing(
            "--semester", "5", "--course", "TMR4182")

    def test_empty_course_directory_refuses_to_replace_existing_resources(self):
        (self.course_a / "Oving" / "Nested" / "solver.py").unlink()
        (self.course_a / "Oving" / "Nested" / "Øving 1.pdf").unlink()
        self.assert_refused_without_writing("--semester", "5",
                                            "--course", "TMR4182")

    def test_normal_additions_and_cosmetic_changes_keep_working(self):
        (self.course_a / "Oving" / "Nested" / "extra.py").write_text(
            "print('new')", encoding="utf-8")
        self.assertEqual(self.invoke("--semester", "5", "--course", "TMR4182"), 0)
        manifest = site.load_json(self.output)
        courses = manifest["semesters"][1]["courses"]
        self.assertTrue(any(r["name"] == "extra.py" for c in courses
                            for r in c["resources"]))
        (self.course_a / "course.json").write_text(
            json.dumps({"code": "TMR4182", "title": "New display title"}),
            encoding="utf-8")
        self.assertEqual(self.invoke("--semester", "5", "--course", "TMR4182"), 0)
        self.assertEqual(self.invoke("--check"), 0)

    def test_same_file_in_two_courses_does_not_count_as_another_courses_file(self):
        original = site.load_json(self.output)
        old = original["semesters"][1]["courses"][0]
        clone = json.loads(json.dumps(original))
        clone["semesters"][1]["courses"][0]["resources"] = []
        removed = site.manifest_removal_counts(original, clone)
        self.assertEqual(removed, (0, len(old["resources"])))

    def test_explicit_reviewed_override_creates_snapshot_before_removal(self):
        (self.course_a / "Oving" / "Nested" / "solver.py").unlink()
        before = self.output.read_bytes()
        self.assertEqual(self.invoke("--semester", "5", "--allow-removals",
                                     "--dry-run"), 0)
        self.assertEqual(self.output.read_bytes(), before)
        self.assertFalse(list(self.backup.glob("*")))
        self.assertEqual(self.invoke("--semester", "5", "--allow-removals"), 0)
        snapshots = list(self.backup.glob("*"))
        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0].read_bytes(), before)
        self.assertNotEqual(self.output.read_bytes(), before)
        self.assertEqual(self.invoke("--check"), 0)
        self.assertEqual(self.invoke("--semester", "5"), 0)

    def test_unrelated_semester_remains_intact_during_scoped_update(self):
        original = site.load_json(self.output)
        before_three = original["semesters"][0]
        (self.course_a / "Oving" / "Nested" / "extra.py").write_text("print(1)")
        self.assertEqual(self.invoke("--semester", "5", "--course", "TMR4182"), 0)
        after = site.load_json(self.output)
        self.assertEqual(after["semesters"][0], before_three)
        self.assertEqual(len(after["semesters"][1]["courses"]), 2)


if __name__ == "__main__":
    unittest.main()
