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

test("on-demand worker fetches same-origin Unicode sibling module and mounts exact path",()=>{
  const received=[],mounted=[];
  class XHR {
    open(method,url,async){received.push({method,url,async})}
    set responseType(value){assert.equal(value,"arraybuffer")}
    send(){this.status=200;this.response=new Uint8Array([35,32,111,107]).buffer}
  }
  const context={self:{
    location:{href:"https://example.org/src/viewers/python-worker.js",origin:"https://example.org"},
    postMessage(){}},URL,XMLHttpRequest:XHR,Uint8Array};
  vm.runInNewContext(source+`
    self.testImport=(url,relative)=>{
      runtime={FS:{
        mkdirTree:p=>self.fsMkdir(p),
        writeFile:(p,bytes)=>self.fsWrite(p,bytes)
      }};
      setSourceBase(url);
      return loadSiblingFile(relative);
    };`,context);
  context.self.fsMkdir=p=>mounted.push(["mkdir",p]);
  context.self.fsWrite=(p,bytes)=>mounted.push(["write",p,bytes.length]);
  const current="https://example.org/semestre/3/Fluid/filer/%C3%98ving%201/main.py";
  assert.equal(context.self.testImport(current,"måling.py"),true);
  assert.equal(received.length,1);
  assert.deepEqual(received[0],{
    method:"GET",
    url:"https://example.org/semestre/3/Fluid/filer/%C3%98ving%201/m%C3%A5ling.py",
    async:false
  });
  assert.ok(mounted.some(x=>x[0]==="write"&&
    x[1]==="/home/pyodide/workspace/måling.py"));
  // Cached, no second network request.
  assert.equal(context.self.testImport(current,"måling.py"),true);
  assert.equal(received.length,1);
  assert.equal(context.self.testImport("https://evil.example/secret.py","module.py"),false);
  assert.equal(received.length,1);
});
