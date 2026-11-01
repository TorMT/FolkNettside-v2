import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const src=readFileSync(new URL("../src/viewers/python-worker.js",import.meta.url),"utf8");
const ctx={self:{postMessage(){},location:{origin:"https://tormt.github.io",href:"https://tormt.github.io/FolkNettside-v2/src/viewers/python-worker.js"}},URL,Uint8Array};
const safeName=runInNewContext(src+"\n;safeName",ctx);

test("Pyodide __file__ retains Norwegian and Unicode names",()=>{
 for(const value of ["Øving3.py","måling_øverst.py","Étage.py","名字.py","ø.py"]){
   assert.equal(safeName(value),value);
 }
 assert.equal(safeName("folder/Øving 3.py"),"Øving 3.py");
});
test("unsafe punctuation remains normalized and empty or dot paths fail",()=>{
 assert.equal(safeName("Ø!&.py"),"Ø__.py");
 for(const value of ["","..",".","////"]){
   assert.throws(()=>safeName(value),/Invalid Python workspace filename/);
 }
});
