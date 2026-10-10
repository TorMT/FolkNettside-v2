"""Regression tests for interactive, metadata-only SiteUpdater scope selection."""
import importlib.util
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("site_updater", ROOT / "scripts" / "update_site.py")
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)

class InteractiveUpdaterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name) / "semesters"
        course = self.source / "5" / "TMR4182"
        (course / "Notes" / "week 1").mkdir(parents=True)
        (course / "Notes" / "week 1" / "notes.txt").write_text("sample", encoding="utf-8")
        (course / "Notes" / "week 1" / "sub.pdf").write_bytes(b"%PDF-1.4")
        (self.source / "6" / "TMR4106").mkdir(parents=True)

    def choose(self, values):
        with patch("builtins.input", side_effect=values), redirect_stdout(io.StringIO()):
            return site.choose_scope(self.source)

    def test_no_hardcoded_semester_or_course(self):
        self.assertEqual(self.choose(["5", "tmr4182"]), (5, "TMR4182"))
        self.assertEqual(self.choose(["6", ""]), (6, None))
        self.assertEqual(self.choose([""]), (None, None))

    def test_invalid_selections_do_not_write(self):
        with self.assertRaises(ValueError):
            self.choose(["99"])
        with self.assertRaises(ValueError):
            self.choose(["5", "missing"])

    def test_declared_course_code_resolves_folder_alias_without_rewriting_others(self):
        course = self.source / "5" / "marin-intro"
        course.mkdir()
        (course / "course.json").write_text('{"code":"TMR4106","title":"Marin"}',
                                           encoding="utf-8")
        self.assertEqual(site.scan_semester(self.source, 5, "TMR4106")["courses"][0]["code"],
                         "TMR4106")
        self.assertEqual(self.choose(["5", "marin-intro"]), (5, "TMR4106"))
        current = {"schemaVersion":2,"semesters":[
            {"id":5,"courses":[{"code":"TMR4106","resources":[]},
                               {"code":"OTHER","resources":[]}]}]}
        merged = site.merge_scope(current, self.source, 5, "marin-intro")
        codes = [course["code"] for course in merged["semesters"][0]["courses"]]
        self.assertEqual(codes.count("TMR4106"), 1)
        self.assertIn("OTHER", codes)

    def test_duplicate_declared_codes_rejected(self):
        first = self.source / "5" / "alias-one"
        second = self.source / "5" / "alias-two"
        first.mkdir()
        second.mkdir()
        for folder in (first,second):
            (folder / "course.json").write_text('{"code":"TMR4000"}', encoding="utf-8")
        with self.assertRaisesRegex(ValueError,"ambiguous"):
            site.scan_semester(self.source, 5, "TMR4000")

    def test_nested_resource_metadata(self):
        result = site.scan_semester(self.source, 5)
        resources = result["courses"][0]["resources"]
        nested = next(item for item in resources if item["name"] == "notes.txt")
        self.assertEqual(nested["folders"], ["week 1"])
        self.assertEqual(nested["section"], "Notes")
        self.assertEqual(nested["kind"], "TXT")

    def test_course_scope_does_not_remove_other_courses(self):
        current = {"schemaVersion":2,"source":"existing","semesters":[
            {"id":5,"label":"Semester 5","courses":[
                {"code":"OTHER","resources":[],"sections":[],"semester":5}]},
            {"id":9,"label":"Semester 9","courses":[]}
        ]}
        updated = site.merge_scope(current, self.source, 5, "TMR4182")
        self.assertEqual([s["id"] for s in updated["semesters"]], [5,9])
        self.assertEqual({c["code"] for c in updated["semesters"][0]["courses"]},{"OTHER","TMR4182"})

    def invoke(self, *arguments):
        output=Path(self.tmp.name)/"manifest.json"
        argv=["update_site.py","--source",str(self.source),"--output",str(output),*arguments]
        with patch("sys.argv",argv),redirect_stdout(io.StringIO()):
            result=site.main()
        return result,output

    def test_dry_run_has_no_manifest_side_effects(self):
        result,output=self.invoke("--dry-run","--semester","5","--course","TMR4182")
        self.assertEqual(result,0)
        self.assertFalse(output.exists())
        result,output=self.invoke("--semester","5","--course","TMR4182")
        self.assertEqual(result,0)
        before=output.read_bytes()
        result,_=self.invoke("--dry-run","--semester","5","--course","TMR4182")
        self.assertEqual(result,0)
        self.assertEqual(output.read_bytes(),before)

    def test_protected_resource_rejected_before_manifest_write(self):
        result,output=self.invoke("--semester","5")
        self.assertEqual(result,0)
        previous=output.read_bytes()
        secret=self.source/"5"/"TMR4182"/"Beskyttet"
        secret.mkdir()
        (secret/"facit.pdf").write_bytes(b"private")
        with patch("sys.stderr",new=io.StringIO()):
            result,_=self.invoke("--semester","5")
        self.assertEqual(result,2)
        self.assertEqual(output.read_bytes(),previous)

    def test_atomic_manifest_preserves_unrelated_semester(self):
        result,output=self.invoke()
        self.assertEqual(result,0)
        data=site.load_json(output)
        self.assertEqual([item["id"] for item in data["semesters"]],[5,6])
        result,_=self.invoke("--semester","5","--course","TMR4182")
        self.assertEqual(result,0)
        data=site.load_json(output)
        self.assertEqual([item["id"] for item in data["semesters"]],[5,6])
        self.assertFalse(list(output.parent.glob(".*.tmp")))


if __name__ == "__main__":
    unittest.main()
