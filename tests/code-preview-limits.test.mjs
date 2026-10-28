import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MAX_CODE_PREVIEW_CHARS,MAX_CODE_PREVIEW_LINES,codePreview}
 from "../src/viewers/code-preview-limits.js";

test("a normal code file remains intact with precise line count",()=>{
 const source='const a = "<script>";\nconst b = "ø";';
 const preview=codePreview(source);
 assert.deepEqual(preview,{text:source,truncated:false,
   displayedChars:source.length,totalChars:source.length,displayedLines:2});
 assert.equal(codePreview("").displayedLines,0);
});
test("multi-megabyte minified source is capped before highlighting",()=>{
 const data="x".repeat(3_000_000);
 const preview=codePreview(data);
 assert.equal(preview.text.length,MAX_CODE_PREVIEW_CHARS);
 assert.equal(preview.totalChars,3_000_000);
 assert.equal(preview.displayedLines,1);
 assert.equal(preview.truncated,true);
 assert.equal(data.length,3_000_000);
});
test("many small lines do not create unlimited DOM rows",()=>{
 const data="x\n".repeat(MAX_CODE_PREVIEW_LINES+500);
 const preview=codePreview(data);
 assert.equal(preview.displayedLines,MAX_CODE_PREVIEW_LINES);
 assert.equal(preview.text.split("\n").length,MAX_CODE_PREVIEW_LINES);
 assert.equal(preview.truncated,true);
});
test("a supplementary Unicode character is not broken at the character limit",()=>{
 const data="x".repeat(MAX_CODE_PREVIEW_CHARS-1)+"🛠"+"rest";
 const preview=codePreview(data);
 assert.equal(preview.text,"x".repeat(MAX_CODE_PREVIEW_CHARS-1));
 assert.ok(!preview.text.includes("\uFFFD"));
 assert.equal(preview.truncated,true);
});
test("code adapter maintains raw Copy and presents clear limited Find/original notice",()=>{
 const code=readFileSync(new URL("../src/viewers/adapters/text.js",import.meta.url),"utf8");
 assert.match(code,/hljs\.highlight\(preview\.text,/);
 assert.match(code,/codeRows\(highlighted\)/);
 assert.match(code,/navigator\.clipboard\.writeText\(text\)/);
 assert.match(code,/Find searches the preview; Copy includes the whole file/);
 assert.match(code,/Use Open original/);
});
