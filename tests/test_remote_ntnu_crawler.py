import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location(
    "crawl_ntnu_public",
    Path(__file__).resolve().parents[1]/"scripts"/"crawl_ntnu_public.py"
)
crawler=importlib.util.module_from_spec(spec)
spec.loader.exec_module(crawler)


def listing(*paths):
    return ('<!doctype html><html><head><title>Index of /semestre/5/Marin-Dynamikk/filer/</title></head><body>'
            '<h1>Index of /semestre/5/Marin-Dynamikk/filer/</h1>'+
            ''.join('<a href="'+p+'">'+p+'</a>' for p in paths)+'</body></html>')


class RemoteCatalogTests(unittest.TestCase):
    def setUp(self):
        self.config={"publicCourses":[{"semester":5,"slug":"Marin-Dynamikk",
                                       "sections":["filer"]}]}
        self.urls=[]
        self.directory=crawler.ORIGIN+"/semestre/5/Marin-Dynamikk/filer/"
        self.pages={
            crawler.ORIGIN+"/semestre/5/index.json":json.dumps({
                "Marin-Dynamikk":{"dir":"Marin-Dynamikk","beskyttet":False,
                                 "files":[]}
            }),
            self.directory:listing("?C=N;O=D","../","%C3%98ving3/",
                                   "Ny%20fil.pdf",".env","beskyttet/","zip.zip"),
            self.directory+"%C3%98ving3/":listing(
                "calculate.py","subfolder/","script%2Epy","secrets.txt"),
            self.directory+"%C3%98ving3/subfolder/":listing(
                "l%C3%B8sning.ipynb")
        }

    def fetch(self,url):
        self.urls.append(url)
        return self.pages[url]

    def test_discover_new_nested_files_without_fetching_contents(self):
        doc=crawler.crawl(self.config,fetch=self.fetch)
        files=doc["semesters"][0]["courses"][0]["resources"]
        names={f["relativePath"] for f in files}
        self.assertIn("filer/Øving3/subfolder/løsning.ipynb",names)
        self.assertIn("filer/Ny fil.pdf",names)
        self.assertIn("filer/Øving3/calculate.py",names)
        self.assertTrue(all(u.endswith("/") or u.endswith("/index.json")
                            for u in self.urls))
        self.assertFalse(any("beskyttet" in u for u in self.urls))
        self.assertNotIn("secrets.txt",json.dumps(doc))
        self.assertEqual(files[0]["source"],"ntnu")
        self.assertTrue(all(f["url"].startswith(crawler.ORIGIN) for f in files))
        self.assertTrue(all(f["size"]==0 and f["modified"]==0 for f in files))

    def test_block_private_courses_before_directory_requests(self):
        self.pages[crawler.ORIGIN+"/semestre/5/index.json"]=json.dumps({
            "Marin-Dynamikk":{"dir":"Marin-Dynamikk","beskyttet":True}
        })
        with self.assertRaisesRegex(ValueError,"no longer explicitly public"):
            crawler.crawl(self.config,fetch=self.fetch)
        self.assertEqual(self.urls,[crawler.ORIGIN+"/semestre/5/index.json"])

    def test_no_open_autoindex_fails_closed_without_parsing_links(self):
        self.pages[self.directory]='<html><title>Course page</title><a href="private.pdf">private</a></html>'
        with self.assertRaisesRegex(ValueError,"Apache directory listing"):
            crawler.crawl(self.config,fetch=self.fetch)


    def test_url_encoding_matches_browser_generated_catalog_for_parentheses(self):
        url=crawler.public_path(5,"Marin-Dynamikk",[
            "filer","Øving (1)","Beregningsark (2).py"
        ])
        self.assertEqual(url,"/semestre/5/Marin-Dynamikk/filer/"
                         "%C3%98ving%20(1)/Beregningsark%20(2).py")
        self.pages[self.directory]=listing("Beregningsark%20%282%29.py")
        record=crawler.crawl(self.config,fetch=self.fetch)[
            "semesters"][0]["courses"][0]["resources"][0]
        self.assertEqual(record["path"],"/semestre/5/Marin-Dynamikk/"
                         "filer/Beregningsark%20(2).py")

    def test_no_cross_origin_directory_escape_or_encoded_paths(self):
        entries=crawler.links_in_directory(listing(
            "https://evil.example/secret.pdf","../private.pdf","%2e%2e/",
            "?C=M;O=A","a%2Fb.pdf","safe%20file.py","sub/","passord-data.txt"
        ),self.directory)
        self.assertEqual(entries,[("safe file.py",False),("sub",True)])

    def test_no_rewrite_if_catalog_unchanged_and_fail_closed_on_loss(self):
        with tempfile.TemporaryDirectory() as root:
            path=Path(root)/"index.json"
            self.assertTrue(crawler.scan_and_write(self.config,path,
                                                    fetch=self.fetch)["changed"])
            before=path.read_bytes()
            self.assertFalse(crawler.scan_and_write(self.config,path,
                                                     fetch=self.fetch)["changed"])
            self.pages[self.directory]=listing("one.pdf")
            with self.assertRaisesRegex(ValueError,"Unexpected resource loss"):
                crawler.scan_and_write(self.config,path,fetch=self.fetch)
            self.assertEqual(path.read_bytes(),before)

    def test_disallow_hostile_course_slugs_without_network_calls(self):
        for slug in ("../secrets","private-stuff","a/b","..","hidden%2e"):
            config={"publicCourses":[{"semester":5,"slug":slug,
                                       "sections":["filer"]}]}
            with self.assertRaises(ValueError):
                crawler.crawl(config,fetch=self.fetch)


    def test_new_first_file_in_previously_empty_public_course_is_detected(self):
        config={"publicCourses":[{"semester":5,"slug":"marin-maskineri",
                                    "sections":["filer"]}]}
        base=crawler.ORIGIN+"/semestre/5/marin-maskineri/filer/"
        pages={
            crawler.ORIGIN+"/semestre/5/index.json":json.dumps({
                "marin-maskineri":{"dir":"marin-maskineri",
                                  "beskyttet":False,"files":[]}
            }),
            base:listing("index.json","ny%20forelesning.pdf")
        }
        visited=[]
        def load(url):
            visited.append(url)
            return pages[url]
        doc=crawler.crawl(config,fetch=load)
        item=doc["semesters"][0]["courses"][0]["resources"][0]
        self.assertEqual(item["relativePath"],"filer/ny forelesning.pdf")
        self.assertEqual(item["kind"],"PDF")
        self.assertEqual(visited,[
            crawler.ORIGIN+"/semestre/5/index.json",base
        ])

    def test_curated_allowlist_indexes_existing_five_semesters_and_empty_s5_folders(self):
        path=Path(__file__).resolve().parents[1]/"config"/"ntnu-public-courses.json"
        config=json.loads(path.read_text(encoding="utf-8"))
        approved=crawler.approved_courses(config)
        self.assertEqual({sid for sid,slug,sections in approved},{1,2,3,4,5})
        self.assertEqual(len(approved),24)
        for slug in ("marin-maskineri","teknologiledelse",
                     "marin-machinery-design-and-condition-monitoring"):
            match=[sections for sid,s,sections in approved if sid==5 and s==slug]
            self.assertEqual(match,[["filer"]],slug)

    def test_invalid_listing_and_hidden_files_not_included(self):
        with self.assertRaisesRegex(ValueError,"Apache directory listing"):
            crawler.links_in_directory("<html>no listings</html>",self.directory)
        self.pages[self.directory]=listing(".env","evil%252e.pdf")
        self.assertEqual(crawler.crawl(self.config,fetch=self.fetch)
                         ["semesters"][0]["courses"][0]["resources"],[])


if __name__=="__main__":
    unittest.main()
