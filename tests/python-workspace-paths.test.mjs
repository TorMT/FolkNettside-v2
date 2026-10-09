import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../src/viewers/python-worker.js",import.meta.url),"utf8");
function getPathValidator(){
  const context={self:{location:{href:"https://example.org/src/viewers/python-worker.js"}},URL};
  vm.runInNewContext(source+"\nself.testPath=safeMountPath;",context);
  return context.self.testPath;
}
test("Python local workspace preserves nested package and dataset paths",()=>{
  const safe=getPathValidator();
  assert.equal(safe("samplelib/wave.py"),"samplelib/wave.py");
  assert.equal(safe("samplelib\\wave.py"),"samplelib/wave.py");
  assert.equal(safe("samples/data/measurements.csv"),"samples/data/measurements.csv");
});
test("Python local upload rejects traversal, hidden files and malformed paths",()=>{
  const safe=getPathValidator();
  for(const name of ["../secret.py","/root.py","a//b.py","a/./b.py","a/../b.py",".ssh/id_rsa","a/.env","a/", "", "a/".repeat(13)+"b.py"]){
    assert.throws(()=>safe(name),/Invalid Python workspace path/,name);
  }
});
