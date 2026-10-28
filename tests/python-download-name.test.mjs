import test from "node:test";
import assert from "node:assert/strict";
import {pythonDownloadFilename} from "../src/viewers/python-download-name.js";

test("download filename keeps the real Norwegian and Unicode script name",()=>{
 for(const value of ["Øving3.py","måling_øverst.py","Étage.py","名字.py"]){
   assert.equal(pythonDownloadFilename(value),value);
 }
});
test("download filename strips path segments, control chars and dangerous punctuation",()=>{
 assert.equal(pythonDownloadFilename("../../kurs/Øving1.py"),"Øving1.py");
 assert.equal(pythonDownloadFilename("C:\\folder\\øving 1.py"),"øving_1.py");
 assert.equal(pythonDownloadFilename("a\nb.py"),"a_b.py");
 assert.equal(pythonDownloadFilename("a?b.py"),"a_b.py");
 for(const invalid of [undefined,null,"","/..","..."])assert.equal(pythonDownloadFilename(invalid),"script.py");
});
test("long names are bounded before creating a browser download",()=>{
 assert.ok(pythonDownloadFilename("Ø".repeat(300)+".py").length<=140);
});
