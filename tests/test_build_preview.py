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

    def test_modulepreload_lists_exactly_the_static_import_graph(self):
        version = "test-commit-123"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src" / "lib").mkdir(parents=True)
            (root / "src" / "app.js").write_text(
                'import {a} from "./a.js?v=%s";\nimport "./lib/side.js?v=%s";\n'
                'export {b} from "./lib/b.js?v=%s";\n'
                '// import {no} from "./commented.js";\n'
                'const lazy=()=>import("./lazy.js?v=%s");\n'
                'const w=new Worker(new URL("./worker.js?v=%s",import.meta.url));\n' % ((version,) * 5))
            (root / "src" / "a.js").write_text('import {b} from "./lib/b.js?v=%s";\nexport const a=1;' % version)
            (root / "src" / "lib" / "b.js").write_text('import {a} from "../a.js?v=%s";\nexport const b=2;' % version)
            (root / "src" / "lib" / "side.js").write_text("globalThis.x=1;")
            for name in ("lazy.js", "worker.js", "commented.js"):
                (root / "src" / name).write_text("export default 1;")
            urls = preview.static_module_urls(root)
            self.assertEqual(urls, [
                "./src/a.js?v=" + version, "./src/lib/b.js?v=" + version, "./src/lib/side.js?v=" + version])
            page = '<head><script type="module" src="./src/app.js?v=%s"></script></head>' % version
            out = preview.add_modulepreload(page, urls)
            self.assertEqual(out.count('rel="modulepreload"'), 3)
            self.assertLess(out.index('rel="modulepreload"'), out.index('<script type="module"'))
            self.assertEqual(preview.add_modulepreload(out, urls), out)

    def test_built_index_preloads_every_static_module_with_the_build_version(self):
        version = "test-commit-123"
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "site"
            preview.build(version, target)
            html = (target / "index.html").read_text(encoding="utf-8")
            import re
            hrefs = re.findall(r'<link rel="modulepreload" href="([^"]+)">', html)
            # Route-level code splitting (#214) keeps lazy page modules out of the static
            # graph, so ~130 modules are preloaded instead of ~210. Sanity floor only.
            self.assertGreater(len(hrefs), 100)
            self.assertEqual(len(hrefs), len(set(hrefs)))
            for href in hrefs:
                path, _, query = href.partition("?")
                self.assertEqual(query, "v=" + version, href)
                self.assertTrue((target / path).is_file(), href)
            self.assertIn("./src/diverse/diverse-registry.js?v=" + version, hrefs)
            # A lazily imported route module must not be preloaded on every page.
            self.assertNotIn("./src/engineering/kisssoft-tool.js?v=" + version, hrefs)
            # On-demand modules must stay on demand.
            self.assertFalse(any("kisssoft-pair-3d.js" in href for href in hrefs))

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
            fusion = target / "scripts" / "fusion_export_folknet.py"
            self.assertTrue(fusion.is_file())
            self.assertIn("import adsk.fusion", fusion.read_text(encoding="utf-8"))
            self.assertFalse((target / "scripts" / "update_site.py").exists())
            self.assertFalse((target / "scripts" / "build_preview.py").exists())
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
