"""Offline regression tests for GitHub Pages static dependency link audit."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("audit_preview_links", ROOT / "scripts" / "audit_preview_links.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class PreviewLinkTests(unittest.TestCase):
    def test_reachable_assets_and_versioned_imports(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for folder in ("assets", "src", "img"):
                (root / folder).mkdir()
            (root / "index.html").write_text('''<link rel="stylesheet" href="./assets/app.css?v=x">
              <script type="module" src="./src/app.js?v=x"></script>
              <img srcset="./img/pic.png 1x, ./img/pic2.png 2x">''')
            (root / "assets/app.css").write_text('''/* url(./unused.jpg) */
              @import "./nested.css"; background:url("../img/pic.png#fragment");''')
            (root / "assets/nested.css").write_text("body{color:red}")
            (root / "src/app.js").write_text('''import {x} from "./one.js?v=x";
              const worker = new Worker(new URL("./worker.js?v=x",import.meta.url));''')
            (root / "src/one.js").write_text("export const x = 1;")
            (root / "src/worker.js").write_text("")
            (root / "img/pic.png").write_bytes(b"image")
            (root / "img/pic2.png").write_bytes(b"image2")
            self.assertEqual(mod.audit_preview_links(root), [])
            (root / "src/worker.js").unlink()
            self.assertTrue(any("src/worker.js" in s for s in mod.audit_preview_links(root)))

    def test_encoded_local_paths_missing_and_escape(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "index.html").write_text('''<img src="./img/%C3%98ving%201.png">
              <script src="../outside.js"></script>
              <link rel="stylesheet" href="/absolute.css">
              <img src="https://example.invalid/external.png">''')
            (root / "img").mkdir()
            (root / "img/Øving 1.png").write_bytes(b"ok")
            messages = mod.audit_preview_links(root)
            self.assertEqual(len(messages), 2)
            self.assertTrue(any("escapes Pages root" in s for s in messages))
            self.assertTrue(any("root-absolute" in s for s in messages))

    def test_only_reachable_modules_checked_and_missing_entrypoint(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.assertEqual(mod.audit_preview_links(root), ["index.html: missing entrypoint"])
            (root / "index.html").write_text('<script src="./ok.js"></script>')
            (root / "ok.js").write_text('import "./nested.js";')
            (root / "nested.js").write_text("")
            (root / "unused.js").write_text('import "./nonexistent.js";')
            self.assertEqual(mod.audit_preview_links(root), [])

    def test_relative_css_urls_and_unsafe_traversal(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "index.html").write_text('<link rel="stylesheet" href="./app.css">')
            (root / "app.css").write_text('''div { background:url("./missing.svg") }
              @import "./missing.css";''')
            issues = mod.audit_preview_links(root)
            self.assertEqual(len(issues), 2)
            self.assertTrue(any("missing.svg" in i for i in issues))
            self.assertTrue(any("missing.css" in i for i in issues))


if __name__ == "__main__":
    unittest.main()
