import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderPythonLines} from "../src/viewers/python-syntax.js";
import {codeRows} from "../src/viewers/highlighted-lines.js";

test("Python preview rows do not create anonymous blank preformatted lines",()=>{
 const html=renderPythonLines("def f():\n    return 2\n");
 assert.equal((html.match(/class="python-code-line"/g)||[]).length,3);
 assert.doesNotMatch(html,/<\/span><\/span>\n<span class="python-code-line">/);
 assert.match(html,/hljs-keyword/);
});
test("shared syntax-colored text rows do not insert blank preformatted lines",()=>{
 const html=codeRows("<span class=\"hljs-keyword\">const</span> x=2;\nconst y=3;");
 assert.equal((html.match(/class="code-line"/g)||[]).length,2);
 assert.doesNotMatch(html,/<\/span><\/span>\n<span class="code-line">/);
});
test("editable Python overlay uses block lines without text nodes between them",()=>{
 const code=readFileSync(new URL("../src/viewers/python-code-cell.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../assets/code-viewer.css",import.meta.url),"utf8");
 assert.match(code,/python-editor-line/);
 assert.match(code,/\.join\(""\)/);
 assert.match(css,/\.python-editor-line\{display:block/);
});
test("source info pane is opt-in and retains viewer accessibility",()=>{
 const source=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../assets/code-viewer.css",import.meta.url),"utf8");
 assert.match(source,/isSource=\["python","notebook","text"\]/);
 assert.match(source,/id="viewer-source-info" aria-controls="viewer-side-panel" aria-expanded="false"/);
 assert.match(source,/detailsPanel\?\.addEventListener\("keydown"/);
 assert.match(css,/\.viewer--source \.viewer-panel\{display:none\}/);
 assert.match(css,/\.viewer--source\.viewer--source-info \.viewer-panel\{display:block\}/);
 assert.match(css,/@media\(max-width:760px\)/);
});
