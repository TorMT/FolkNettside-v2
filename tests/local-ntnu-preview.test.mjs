import test from "node:test";
import assert from "node:assert/strict";
import {canRetryNTNUWithLocalFile,createNTNULocalPreview} from "../src/viewers/local-ntnu-preview.js";
import {viewerKind} from "../src/viewers/registry.js";
import {readFileSync} from "node:fs";

const source={
  source:"ntnu",remoteArchive:true,kind:"PY",name:"Øving 5.py",
  url:"https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%C3%98ving%205.py"
};
test("only public NTNU course resources may reopen downloaded files",()=>{
 assert.equal(canRetryNTNUWithLocalFile(source),true);
 for(const patch of [
  {url:"https://evil.invalid/semestre/5/Marin-Dynamikk/filer/a.py"},
  {url:"https://tormt.folk.ntnu.no.evil.com/semestre/5/Marin-Dynamikk/filer/a.py"},
  {url:source.url+"?api_key=secret"},
  {url:"https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/../private.py"},
  {url:"https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%2Fsecret.py"},
  {remoteArchive:false},{source:"other"},{kind:"QUIZ"},
  {name:".env"},{name:"bad.ZIP",url:source.url}
 ])assert.equal(canRetryNTNUWithLocalFile({...source,...patch}),false,
   JSON.stringify(patch));
});
test("local blob previews route by original file name without changing NTNU URL",()=>{
 let called=0;
 const file={name:"Øving 5.py",size:20};
 const local=createNTNULocalPreview(source,file,{makeURL:()=>{
   called++;return "blob:https://tormt.github.io/dummy123";
 }});
 assert.equal(called,1);
 assert.equal(local.path,"blob:https://tormt.github.io/dummy123");
 assert.equal(local.url,source.url);
 assert.equal(local.remoteArchive,false);
 assert.equal(viewerKind(local),"python");
});
test("reject mismatched extension and oversized input before allocating blob",()=>{
 let called=false;
 for(const file of [{name:"data.json",size:5},
   {name:"Øving 5.py",size:55*1024*1024+1},
   {name:"Øving 5.py",size:-1}]){
   assert.throws(()=>createNTNULocalPreview(source,file,{makeURL:()=>{called=true;return "blob:x"}}));
 }
 assert.equal(called,false);
});
test("local retry control remains available in fallback with cleanup on next viewer",()=>{
 const shell=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
 assert.match(shell,/id="viewer-choose-local"/);
 assert.match(shell,/createNTNULocalPreview\(resource,file\)/);
 assert.match(shell,/URL\.revokeObjectURL\(resource\.path\)/);
 assert.match(shell,/bindLocalChoice\(\)/);
});
