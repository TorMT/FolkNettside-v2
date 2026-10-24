import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewContentURL} from "../src/viewers/utils.js";

test("local downloaded blob overrides remote NTNU content URL but not original navigation",()=>{
 const original="https://tormt.folk.ntnu.no/semestre/5/course/filer/example.docx";
 const local="blob:https://tormt.github.io/temporary-preview";
 assert.equal(previewContentURL({url:original,path:local,localPreview:true}),local);
 assert.equal(previewContentURL({url:original,path:local}),original);
 assert.equal(previewContentURL({url:original,path:"/asset.pdf",localPreview:false}),original);
 assert.equal(previewContentURL({path:"/asset.pdf"}),"/asset.pdf");
 assert.equal(previewContentURL({url:original,path:"https://evil.example",localPreview:true}),original);
});
test("all original-first binary/media adapters select the local object URL",()=>{
 for(const name of ["image","audio","video","office","fusion","archive"]){
  const source=readFileSync(new URL("../src/viewers/adapters/"+name+".js",import.meta.url),"utf8");
  assert.match(source,/previewContentURL\(resource\)/,name);
 }
 const fusion=readFileSync(new URL("../src/viewers/adapters/fusion.js",import.meta.url),"utf8");
 assert.match(fusion,/extension\(resource\.localPreview===true\?resource\.name:/);
 const browser=readFileSync(new URL("../tests/browser/viewer-matrix-smoke.html",import.meta.url),"utf8");
 assert.match(browser,/DOCX local retry still fetched remote NTNU URL/);
});