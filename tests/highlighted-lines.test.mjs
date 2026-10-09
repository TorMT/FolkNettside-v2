import test from "node:test";
import assert from "node:assert/strict";
import {splitHighlightedLines,codeRows} from "../src/viewers/highlighted-lines.js";

test("highlight.js multiline string markup stays balanced on each rendered line",()=>{
 const input='<span class="hljs-keyword">const</span> s = <span class="hljs-string">first\nsecond\nthird</span>';
 const lines=splitHighlightedLines(input);
 assert.equal(lines.length,3);
 for(const line of lines){
   assert.equal((line.match(/<span /g)||[]).length,(line.match(/<\/span>/g)||[]).length,line);
 }
 assert.match(lines[1],/<span class="hljs-string">second<\/span>/);
 assert.equal((codeRows(input).match(/class="code-line"/g)||[]).length,3);
});
test("plain escaped source lines remain intact and untrusted tags cannot enter as markup",()=>{
 const lines=splitHighlightedLines("&lt;script&gt;\nprint('ok')\n");
 assert.equal(lines.length,3);
 assert.match(lines[0],/&lt;script&gt;/);
 const blocked=splitHighlightedLines("safe<img onerror=alert(1)>");
 assert.doesNotMatch(blocked[0],/<img /);
 assert.match(blocked[0],/&lt;img /);
});
