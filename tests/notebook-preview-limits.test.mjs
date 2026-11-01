import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 MAX_NOTEBOOK_PREVIEW_CELLS,MAX_NOTEBOOK_SAVED_OUTPUTS,
 MAX_NOTEBOOK_OUTPUT_CHARS,MAX_NOTEBOOK_PNG_BASE64,
 notebookPreviewCells,notebookSavedOutputs,limitedNotebookText,notebookPNGData
} from "../src/viewers/notebook-preview-limits.js";
import {renderNotebookOutput} from "../src/viewers/adapters/notebook.js";

test("notebook preview caps DOM/editor cells without mutating source",()=>{
 const original=Array.from({length:450},(_,i)=>({cell_type:"code",source:[String(i)]}));
 const preview=notebookPreviewCells(original);
 assert.equal(preview.total,450);
 assert.equal(preview.items.length,MAX_NOTEBOOK_PREVIEW_CELLS);
 assert.equal(preview.omitted,150);
 assert.equal(preview.items[0],original[0]);
 assert.equal(original.length,450);
 assert.deepEqual(notebookPreviewCells(null),{items:[],omitted:0,total:0});
});
test("per-cell saved output preview caps repeated outputs, without dropping source",()=>{
 const raw=Array.from({length:80},(_,i)=>({text:String(i)}));
 const display=notebookSavedOutputs(raw);
 assert.equal(display.items.length,MAX_NOTEBOOK_SAVED_OUTPUTS);
 assert.equal(display.omitted,40);
 assert.equal(raw.length,80);
});
test("long streamed-style text arrays are shortened before joining entire payload",()=>{
 const chunks=Array.from({length:60},()=>("é".repeat(4000)));
 const value=limitedNotebookText(chunks);
 assert.equal(value.text.length,MAX_NOTEBOOK_OUTPUT_CHARS);
 assert.equal(value.truncated,true);
 assert.deepEqual(limitedNotebookText(["a","b"]),{text:"ab",truncated:false});
 assert.match(renderNotebookOutput({text:chunks}),/Saved text shortened in preview/);
 assert.ok(renderNotebookOutput({text:chunks}).length<MAX_NOTEBOOK_OUTPUT_CHARS+2000);
});
test("oversized image/png base64 is omitted; small valid PNG data remains visible",()=>{
 const huge="A".repeat(MAX_NOTEBOOK_PNG_BASE64+1);
 assert.deepEqual(notebookPNGData(huge),{data:"",omitted:true});
 assert.deepEqual(notebookPNGData(["aGVs","bG8="]),{data:"aGVsbG8=",omitted:false});
 assert.match(renderNotebookOutput({data:{"image/png":huge}}),/Large saved plot omitted/);
 assert.doesNotMatch(renderNotebookOutput({data:{"image/png":huge}}),/<img/);
 assert.match(renderNotebookOutput({data:{"image/png":["aGVs","bG8="]}}),/data:image\/png;base64,aGVsbG8=/);
 assert.doesNotMatch(renderNotebookOutput({data:{"image/png":'abc" onerror="x'}}),/<img/);
});
test("long untrusted saved errors are escaped and shortened",()=>{
 const html=renderNotebookOutput({ename:"<script>",evalue:"X".repeat(200000)});
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/Saved error shortened/);
 assert.ok(html.length<MAX_NOTEBOOK_OUTPUT_CHARS+2000);
});
test("notebook UI keeps an explicit original-file escape hatch for truncated previews",()=>{
 const code=readFileSync(new URL("../src/viewers/adapters/notebook.js",import.meta.url),"utf8");
 const shell=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
 assert.match(code,/Preview limited to the first/);
 assert.match(code,/additional saved outputs omitted/);
 assert.match(code,/notebookPreviewCells\(notebook\.cells\)/);
 assert.match(shell,/id="open-original"/);
});
