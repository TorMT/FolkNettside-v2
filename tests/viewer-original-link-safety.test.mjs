import test from "node:test";
import assert from "node:assert/strict";
import {safeViewerOriginalURL} from "../src/viewers/utils.js";
import {readFileSync} from "node:fs";

test("approved absolute original and local relative paths are unchanged",()=>{
  for(const candidate of [
    "https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%C3%98ving%201.pdf",
    "http://127.0.0.1:8080/preview.pdf",
    "../../examples/semesters/5/TMR4182/Kok/hydro-demo.py",
    "./files/notes.pdf",
    "/FolkNettside-v2/examples/semesters/5/fag.pdf",
  ])assert.equal(safeViewerOriginalURL({url:candidate}),candidate,candidate);
  assert.equal(safeViewerOriginalURL({
    url:"https://tormt.folk.ntnu.no/semestre/5/public.pdf",
    path:"blob:https://tormt.github.io/local-copy"
  }),"https://tormt.folk.ntnu.no/semestre/5/public.pdf");
});

test("metadata cannot open executable, credentialed or ambiguous original URLs",()=>{
  for(const candidate of [
    "javascript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://tormt.github.io/injected",
    "//evil.example/path",
    "\\\\evil.example/path",
    "https://user:pass@tormt.folk.ntnu.no/semestre/5/file.pdf",
    "https://evil.example/path\tbad",
    " https://tormt.folk.ntnu.no/file.pdf",
    "https://tormt.folk.ntnu.no/file.pdf ",
    "",null,undefined
  ])assert.equal(safeViewerOriginalURL({path:candidate}),null,String(candidate));
  assert.equal(safeViewerOriginalURL({url:"javascript:alert(1)",path:"/legit.pdf"}),null,
    "An explicit unsafe original must never fall back to another path");
});

test("viewer shell gates the button and its fallback anchor with one safe original",()=>{
  const code=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
  assert.match(code,/const originalURL=safeViewerOriginalURL\(resource\)/);
  assert.match(code,/id="open-original" \$\{originalURL\?/);
  assert.match(code,/if\(originalURL\)root\.querySelector\("#open-original"\)\.onclick/);
  assert.match(code,/href="\$\{escapeHTML\(originalURL\)\}"/);
  assert.doesNotMatch(code,/href="\$\{escapeHTML\(resource\.url\|\|resource\.path\|\|"#"/);
});
