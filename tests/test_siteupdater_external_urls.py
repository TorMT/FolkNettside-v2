"""Fail-closed SiteUpdater publication of unsafe external course links."""
import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("siteupdater_external_urls",ROOT/"scripts"/"update_site.py")
site=importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class ExternalResourceSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name)
        self.source=self.base/"semesters"
        self.course=self.source/"5"/"Public"
        self.course.mkdir(parents=True)
        self.manifest=self.base/"manifest.json"
        self.backups=self.base/"backups"

    def set_link(self,url):
        (self.course/"course.json").write_text(json.dumps({
            "code":"PUBLIC","externalResources":[{
                "provider":"video","name":"Lecture","label":"Lecture","url":url
            }]
        }),encoding="utf-8")

    def run_updater(self,*flags):
        stdout,stderr=io.StringIO(),io.StringIO()
        args=["update_site.py","--source",str(self.source),
              "--output",str(self.manifest),"--backup-dir",str(self.backups),*flags]
        with patch("sys.argv",args),redirect_stdout(stdout),patch("sys.stderr",stderr):
            return site.main(),stdout.getvalue(),stderr.getvalue()

    def test_credentials_are_never_published_or_logged_or_backed_up(self):
        self.set_link("https://www.youtube.com/watch?v=abc123")
        outcome,_,_=self.run_updater()
        self.assertEqual(outcome,0)
        saved=self.manifest.read_bytes()
        unsafe=[
            "https://user:PRIVATE_EXAMPLE@example.org/video",
            "https://example.org/video?api_key=PRIVATE_EXAMPLE",
            "https://example.org/video#access_token=PRIVATE_EXAMPLE",
            "http://example.org/video?access_token=PRIVATE_EXAMPLE",
        ]
        for url in unsafe:
            with self.subTest(scheme=url.split(":")[0]):
                self.set_link(url)
                for flags in [(),("--semester","5"),("--dry-run",)]:
                    outcome,stdout,stderr=self.run_updater(*flags)
                    self.assertEqual(outcome,2)
                    self.assertEqual(self.manifest.read_bytes(),saved)
                    self.assertFalse(self.backups.exists())
                    self.assertNotIn("PRIVATE_EXAMPLE",stdout+stderr)
                    self.assertNotIn(url,stdout+stderr)

    def test_benign_query_links_survive_scoped_updates(self):
        self.set_link("https://www.youtube.com/watch?v=abc123&start=30")
        outcome,_,error=self.run_updater("--semester","5")
        self.assertEqual(outcome,0,error)
        course=self.manifest.parent
        published=site.load_json(self.manifest)
        external=published["semesters"][0]["courses"][0]["resources"][0]
        self.assertEqual(external["url"],
                         "https://www.youtube.com/watch?v=abc123&start=30")


if __name__=="__main__":
    unittest.main()
