import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../src/viewers/python-worker.js",import.meta.url),"utf8");
function getPathValidator(){
  const context={self:{location:{href:"https://example.org/src/viewers/python-worker.js"}},URL};
  vm.runInNewContext(source+"\nself.testPath=safeMountPath;self.testSibling=safeSiblingRelativePath;",context);
  return {mount:context.self.testPath,sibling:context.self.testSibling};
}
test("Python local workspace preserves nested package and dataset paths",()=>{
  const {mount:safe}=getPathValidator();
  assert.equal(safe("samplelib/wave.py"),"samplelib/wave.py");
  assert.equal(safe("samplelib\\wave.py"),"samplelib/wave.py");
  assert.equal(safe("samples/data/measurements.csv"),"samples/data/measurements.csv");
});
test("Python local upload rejects traversal, hidden files and malformed paths",()=>{
  const {mount:safe}=getPathValidator();
  for(const name of ["../secret.py","/root.py","a//b.py","a/./b.py","a/../b.py",".ssh/id_rsa","a/.env","a/", "", "a/".repeat(13)+"b.py"]){
    assert.throws(()=>safe(name),/Invalid Python workspace path/,name);
  }
});


test("NTNU Unicode course, nested Python modules and filenames retain exact names",()=>{
  const {mount,sibling}=getPathValidator();
  assert.equal(mount("Øving 3/Bølgeteori/måling.py"),"Øving 3/Bølgeteori/måling.py");
  assert.equal(mount("Løsning/Åpen fil.csv"),"Løsning/Åpen fil.csv");
  assert.equal(sibling("Løsning/øving.py"),"Løsning/øving.py");
  assert.equal(sibling("måling.py"),"måling.py");
  assert.equal(sibling("klær/kode.py"),"klær/kode.py");
});
test("NTNU sibling importer rejects traversal, hidden, encoded and cross-folder paths",()=>{
  const {sibling}=getPathValidator();
  for(const path of ["../secrets.py","../../filer/vault.json",".env","mod/.secret.py",
    "/server/config.py","a//x.py","a/./x.py","a/../x.py",
    "a/%2e%2e/secret.py","https://evil.invalid/module.py",
    "a?x.py","a#fragment.py",""])
    assert.equal(sibling(path),null,path);
  assert.equal(sibling("a\\x.py"),"a/x.py");
});
