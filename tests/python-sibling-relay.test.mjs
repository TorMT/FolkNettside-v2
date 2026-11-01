import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {createPythonSession} from "../src/viewers/python-session.js";

const relay="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-public-code";
const root="https://tormt.folk.ntnu.no";
const folder="/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/";
const source=root+folder+"main.py";
const approved=relay+"?path="+encodeURIComponent(folder+"main.py");

function fakeWorker(){
 const requested=[],written=[];
 class XHR{
   open(method,url,async){requested.push({method,url,async})}
   send(){this.status=200;this.response=new Uint8Array([97,61,49]).buffer}
 }
 const self={
   location:{href:"https://tormt.github.io/FolkNettside-v2/src/viewers/python-worker.js",
     origin:"https://tormt.github.io"},postMessage(){}
 };
 const workerSource=readFileSync(new URL("../src/viewers/python-worker.js",import.meta.url),"utf8");
 const worker=runInNewContext(workerSource+
   "\n;({setSourceBase,loadSiblingFile,setRuntime(value){runtime=value}})",
   {self,XMLHttpRequest:XHR,URL,Uint8Array});
 worker.setRuntime({FS:{
   mkdirTree(){},
   writeFile(path,data){written.push({path,bytes:[...data]})}
 }});
 return {worker,requested,written};
}
test("public NTNU Python sibling import uses exact allowlisted read-only relay",()=>{
 const {worker,requested,written}=fakeWorker();
 worker.setSourceBase(source,approved);
 assert.equal(worker.loadSiblingFile("lesinput.py"),true);
 assert.deepEqual(requested,[{method:"GET",url:relay+"?path="+encodeURIComponent(folder+"lesinput.py"),async:false}]);
 assert.equal(written[0].path,"/home/pyodide/workspace/lesinput.py");
 assert.deepEqual(written[0].bytes,[97,61,49]);
 assert.equal(worker.loadSiblingFile("../other.py"),false);
 assert.equal(worker.loadSiblingFile("/secret.py"),false);
 assert.equal(worker.loadSiblingFile(".env"),false);
 assert.equal(requested.length,1);
});
test("unapproved or unrelated source cannot enable NTNU sibling requests",()=>{
 for(const [url,approval] of [
   [source,""],[source,relay+"?path="+encodeURIComponent(folder+"other.py")],
   ["https://example.com/"+folder+"main.py",approved],
   [source+"?token=private",approved],
   [source+"#other",approved],
   [root+"/semestre/1/itgk/private.py",approved]
 ]){
   const {worker,requested}=fakeWorker();
   worker.setSourceBase(url,approval);
   assert.equal(worker.loadSiblingFile("lesinput.py"),false);
   assert.equal(requested.length,0);
 }
});
test("same-origin project scripts still import sibling modules directly",()=>{
 const {worker,requested}=fakeWorker();
 worker.setSourceBase("https://tormt.github.io/FolkNettside-v2/project/main.py");
 assert.equal(worker.loadSiblingFile("utils.py"),true);
 assert.equal(requested[0].url,"https://tormt.github.io/FolkNettside-v2/project/utils.py");
});
test("Python session forwards the optional sibling relay without auto-running code",async()=>{
 let posted;
 const instance={postMessage(value){posted=value},terminate(){}};
 const session=createPythonSession({workerFactory:()=>instance});
 const promise=session.run("print(42)",{sourceURL:source,siblingRelayURL:approved});
 assert.equal(posted.type,"run");
 assert.equal(posted.sourceURL,source);
 assert.equal(posted.siblingRelayURL,approved);
 instance.onmessage({data:{id:posted.id,phase:"done",ok:true,stdout:"42"}});
 assert.equal((await promise).stdout,"42");
 session.dispose();
});

test("same-origin URL query and fragment do not disable sibling imports",()=>{
 for(const tail of ["?v=2","#cell-1","?v=2#cell-1"]){
   const {worker,requested}=fakeWorker();
   worker.setSourceBase("https://tormt.github.io/FolkNettside-v2/project/main.py"+tail);
   assert.equal(worker.loadSiblingFile("utils.py"),true);
   assert.equal(requested[0].url,"https://tormt.github.io/FolkNettside-v2/project/utils.py");
 }
});
