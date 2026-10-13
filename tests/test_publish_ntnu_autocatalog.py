"""Only V2's auto-index can change; original NTNU files are untouchable."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
spec=importlib.util.spec_from_file_location(
    "publish_ntnu_autocatalog",ROOT/"scripts"/"publish_ntnu_autocatalog.py")
publisher=importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class NtnuAutoPublisherTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root=Path(temp.name)
        self.webroot=root/"webedit"
        self.webroot.mkdir()
        (self.webroot/"index.html").write_text("V1 original")
        self.semester=self.webroot/"semestre"/"5"
        self.course=self.semester/"Marin-Dynamikk"
        section=self.course/"filer"
        section.mkdir(parents=True)
        (self.semester/"index.json").write_text(json.dumps({
            "Marin-Dynamikk":{"dir":"Marin-Dynamikk","beskyttet":False,"files":[]}
        }))
        (self.course/"index.json").write_text(json.dumps({
            "filer":{"dir":"filer","beskyttet":False,"files":[]}
        }))
        self.file=section/"oppgave.py"
        self.file.write_text("print(1)")
        self.allow={"publicCourses":[{
            "semester":5,"slug":"Marin-Dynamikk",
            "sections":["filer"],"title":"Marin dynamikk"
        }]}
        self.stage=self.webroot/"v2-staging"
        data=self.stage/"data"
        data.mkdir(parents=True)
        (self.stage/"index.html").write_text("V2 staging")
        self.target=data/"ntnu-autocatalog.json"
        self.backup=root/"private-backups"
        self.backup.mkdir()

    def test_dry_run_and_apply_touch_only_catalog_not_legacy(self):
        report=publisher.publish(self.webroot,self.allow,self.backup)
        self.assertTrue(report["changed"])
        self.assertFalse(report["applied"])
        self.assertFalse(self.target.exists())
        result=publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertTrue(result["applied"])
        self.assertEqual(result["newResources"],1)
        self.assertEqual(json.loads(self.target.read_text())["schemaVersion"],2)
        self.assertEqual((self.webroot/"index.html").read_text(),"V1 original")
        self.assertEqual((self.stage/"index.html").read_text(),"V2 staging")
        self.assertTrue(self.file.is_file())
        self.assertEqual(json.loads((self.semester/"index.json").read_text())
                         ["Marin-Dynamikk"]["files"],[])
        again=publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertFalse(again["changed"])

    def test_edit_creates_external_backup_and_never_deletes_files(self):
        publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        first=self.target.read_bytes()
        (self.course/"filer"/"andre.py").write_text("print(2)")
        report=publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertEqual(report["newResources"],2)
        self.assertEqual(report["deletedFiles"],0)
        backups=list(self.backup.glob("ntnu-autocatalog-*.json"))
        self.assertEqual(len(backups),1)
        self.assertEqual(backups[0].read_bytes(),first)
        self.assertNotEqual(self.target.read_bytes(),first)

    def test_large_disappearance_refused_without_manual_override(self):
        for number in range(12):
            (self.course/"filer"/f"f{number}.py").write_text("print('test')")
        publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        previous=self.target.read_bytes()
        for number in range(10):
            (self.course/"filer"/f"f{number}.py").unlink()
        with self.assertRaisesRegex(ValueError,"25 percent"):
            publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertEqual(self.target.read_bytes(),previous)
        manual=publisher.publish(self.webroot,self.allow,self.backup,
                                apply=True,allow_removals=True)
        self.assertEqual(manual["newResources"],3)

    def test_no_write_without_reviewed_v2_staging_or_external_backup(self):
        self.assertRaises(ValueError,publisher.publish,self.webroot,self.allow,
                          self.webroot/"backups",apply=True)
        with self.assertRaises(ValueError):
            publisher.publish(self.webroot,self.allow,
                              self.webroot/"../webedit/backups",apply=True)
        (self.stage/"index.html").unlink()
        with self.assertRaisesRegex(ValueError,"V2 staging"):
            publisher.publish(self.webroot,self.allow,self.backup,apply=True)

    def test_symlink_catalog_is_rejected(self):
        other=self.backup/"outside.json"
        other.write_text("LEAVE ALONE")
        self.target.symlink_to(other)
        with self.assertRaisesRegex(ValueError,"Unsafe"):
            publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertEqual(other.read_text(),"LEAVE ALONE")

    def test_missing_reviewed_section_raises_instead_of_publishing_empty_catalog(self):
        publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        previous=self.target.read_bytes()
        (self.course/"index.json").write_text('{"filer":{"beskyttet":true}}')
        with self.assertRaises(ValueError):
            publisher.publish(self.webroot,self.allow,self.backup,apply=True)
        self.assertEqual(self.target.read_bytes(),previous)


if __name__=="__main__":
    unittest.main()
