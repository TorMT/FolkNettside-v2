"""Regression checks for V2 GitHub Pages build versioning and source isolation."""

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build_preview", ROOT / "scripts" / "build_preview.py")
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PagesBuildTests(unittest.TestCase):
    def test_js_imports_and_workers_are_versioned_once(self):
        version = "test-commit-123"
        source = (
            'import { x } from "./one.js";\n'
            'const y = import("../two.js");\n'
            'const w = new Worker(new URL("./worker.js", import.meta.url));\n'
        )
        stamped = preview.stamp_js(source, version)
        self.assertIn('./one.js?v=test-commit-123', stamped)
        self.assertIn('../two.js?v=test-commit-123', stamped)
        self.assertIn('./worker.js?v=test-commit-123', stamped)
        self.assertEqual(preview.stamp_js(stamped, version), stamped)

    def test_index_versioning_is_idempotent(self):
        version = "test-commit-123"
        source = ('<link rel="stylesheet" href="./assets/style.css">'
                  '<link rel="stylesheet" href="./assets/engineering.css">'
                  '<link rel="stylesheet" href="./assets/viewer-enhancements.css">'
                  '<script type="module" src="./src/app.js"></script>')
        stamped = preview.stamp_index(source, version)
        self.assertIn('./assets/style.css?v=' + version, stamped)
        self.assertIn('./assets/engineering.css?v=' + version, stamped)
        self.assertIn('./assets/viewer-enhancements.css?v=' + version, stamped)
        self.assertIn('./src/app.js?v=' + version, stamped)
        self.assertEqual(preview.stamp_index(stamped, version), stamped)

    def test_deploy_tree_matches_commit_without_mutating_source(self):
        version = "test-commit-123"
        source_index = (ROOT / "index.html").read_bytes()
        source_app = (ROOT / "src" / "app.js").read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "site"
            preview.build(version, target)
            self.assertEqual((target / "build.txt").read_text().strip(), version)
            self.assertTrue((target / ".nojekyll").is_file())
            self.assertTrue((target / "data" / "content-manifest.json").is_file())
            self.assertIn("app.js?v=" + version, (target / "index.html").read_text())
            self.assertEqual((ROOT / "index.html").read_bytes(), source_index)
            self.assertEqual((ROOT / "src" / "app.js").read_bytes(), source_app)



    def test_build_refuses_unmarked_existing_output_without_deleting_it(self):
        with tempfile.TemporaryDirectory() as directory:
            destination=Path(directory)/"valuable"
            destination.mkdir()
            sentinel=destination/"do-not-delete.txt"
            sentinel.write_text("keep",encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"unmarked"):
                preview.build("test-sha",destination)
            self.assertEqual(sentinel.read_text(encoding="utf-8"),"keep")

    def test_build_rejects_source_and_repo_output_paths(self):
        for destination in (ROOT, ROOT/"src", ROOT/"src"/"temp-deploy"):
            with self.assertRaisesRegex(ValueError,"Unsafe|Cannot build"):
                preview.build("test-sha",destination)

    def test_build_rejects_control_characters_in_version(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError,"single-line"):
                preview.build("sha\nspoofed",Path(directory)/"preview")

if __name__ == "__main__":
    unittest.main()
