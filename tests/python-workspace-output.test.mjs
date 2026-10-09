import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../src/viewers/python-worker.js",import.meta.url),"utf8");
function createHarness(){
  const context={self:{location:{href:"https://example.org/src/viewers/python-worker.js"}},URL};
  vm.runInNewContext(source+"\nself.prepareMountFiles=prepareMountFiles;self.generatedFiles=generatedFiles;self.markUploaded=name=>uploadedFiles.add(name);",context);
  return context.self;
}

test("Python workspace preflights entire upload before filesystem writes",()=>{
  const h=createHarness();
  const bytes=new Uint8Array([1,2,3]);
  const valid=h.prepareMountFiles([{name:"lib/a.py",data:bytes},{name:"data/stations.csv",data:bytes}]);
  assert.deepEqual(Array.from(valid,x=>x.name),["lib/a.py","data/stations.csv"]);
  assert.throws(()=>h.prepareMountFiles([
    {name:"lib/a.py",data:bytes},{name:"lib/a.py",data:bytes}
  ]),/Duplicate/);
  assert.throws(()=>h.prepareMountFiles([
    {name:"valid.py",data:bytes},{name:"../invalid.py",data:bytes}
  ]),/Invalid Python workspace path/);
  assert.throws(()=>h.prepareMountFiles([
    {name:"large.bin",data:new Uint8Array(8_000_001)}
  ]),/8 MB/);
});

test("Python results include nested generated outputs but exclude source files",()=>{
  const h=createHarness();
  const base="/home/pyodide/workspace";
  const bytes=new Uint8Array([42]);
  const entries={
    [base]:[".","..","data","figures","main.py","__pycache__"],
    [base+"/data"]:[".","..","source.csv","computed.csv"],
    [base+"/figures"]:[".","..","plot.png"]
  };
  const files=new Map([
    [base+"/main.py",bytes],[base+"/data/source.csv",bytes],
    [base+"/data/computed.csv",bytes],[base+"/figures/plot.png",bytes]
  ]);
  h.markUploaded("main.py");
  h.markUploaded("data/source.csv");
  const fs={
    readdir:path=>entries[path]??[],
    stat:path=>({mode:entries[path]?"dir":"file",size:files.get(path)?.length??0}),
    isDir:mode=>mode==="dir",
    isFile:mode=>mode==="file",
    readFile:path=>files.get(path)
  };
  const results=h.generatedFiles({FS:fs});
  assert.deepEqual(Array.from(results,r=>r.name).sort(),["data/computed.csv","figures/plot.png"]);
  assert.equal(results.every(x=>x.bytes.length===1),true);
});
