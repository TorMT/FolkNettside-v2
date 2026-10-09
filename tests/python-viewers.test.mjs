import test from "node:test";
import assert from "node:assert/strict";
import {createPythonSession} from "../src/viewers/python-session.js";
import {cellText,renderMarkdownCell,renderNotebookOutput} from "../src/viewers/adapters/notebook.js";

class FakeWorker{
  static instances=[];
  constructor(){this.sent=[];this.terminated=false;FakeWorker.instances.push(this)}
  postMessage(data){this.sent.push(data)}
  terminate(){this.terminated=true}
  reply(data){this.onmessage({data})}
}
test("Python session sends code, handles stdout/error and preserves one Worker between cells",async()=>{
 const session=createPythonSession({workerFactory:()=>new FakeWorker()});
 const a=session.run('x=2;print(x)');
 const worker=FakeWorker.instances.at(-1);
 assert.equal(worker.sent[0].type,"run");
 assert.equal(worker.sent[0].code,"x=2;print(x)");
 worker.reply({id:worker.sent[0].id,phase:"done",ok:true,stdout:"2",stderr:""});
 assert.equal((await a).stdout,"2");
 const b=session.run("print(x+1)");
 assert.equal(FakeWorker.instances.at(-1),worker);
 worker.reply({id:worker.sent[1].id,phase:"done",ok:false,error:"NameError",stderr:"traceback"});
 await assert.rejects(b,/NameError/);
 session.dispose();assert.equal(worker.terminated,true);
});
test("Stop aborts pending work and Run after Stop starts a fresh interpreter",async()=>{
 const session=createPythonSession({workerFactory:()=>new FakeWorker()});
 const a=session.run("while True: pass");
 const old=FakeWorker.instances.at(-1);
 session.stop();
 await assert.rejects(a,/stopped/);
 assert.equal(old.terminated,true);
 const b=session.run("print(99)");
 const current=FakeWorker.instances.at(-1);
 assert.notEqual(current,old);
 current.reply({id:current.sent[0].id,phase:"done",ok:true,stdout:"99"});
 assert.equal((await b).stdout,"99");
 session.dispose();
 assert.throws(()=>session.run("pass"),/closed/);
});
test("Markdown and notebook output are escaped, graphics only PNG data",()=>{
 assert.equal(cellText(["a","b"]),"ab");
 assert.match(renderMarkdownCell(["# Intro","<img src=x onerror=alert(1)>"]),/&lt;img/);
 const out=renderNotebookOutput({data:{"text/plain":["<b>unsafe</b>"],
 "image/png":"aGVsbG8="}});
 assert.match(out,/&lt;b&gt;unsafe/);
 assert.match(out,/data:image\/png;base64,aGVsbG8=/);
 const unsafe=renderNotebookOutput({data:{"image/png":'abc" onerror="alert(1)'}});
 assert.doesNotMatch(unsafe,/<img/);
});


test("Python session mounts nested project files, streams output and isolates stale Worker events",async()=>{
 const session=createPythonSession({workerFactory:()=>new FakeWorker()});
 const paths=["main.py","samplelib/__init__.py","samplelib/wave.py","data/measurements.csv"];
 const mount=session.mount(paths.map(path=>({path,content:"fixture"})));
 const old=FakeWorker.instances.at(-1);
 assert.equal(old.sent[0].type,"mount");
 assert.deepEqual(old.sent[0].files.map(file=>file.path),paths);
 old.reply({id:old.sent[0].id,phase:"done",ok:true});
 await mount;
 const chunks=[],statuses=[];
 const run=session.run("from samplelib.wave import wave",{
   status:value=>statuses.push(value),
   onOutput:value=>chunks.push(value),
   sourceURL:"main.py"
 });
 assert.equal(session.running,true);
 const message=old.sent[1];
 assert.equal(message.sourceURL,"main.py");
 old.reply({id:message.id,phase:"loading"});
 old.reply({id:message.id,phase:"output",output:"imported"});
 assert.equal(session.running,true);
 old.reply({id:message.id,phase:"done",ok:true,stdout:"imported"});
 assert.equal((await run).stdout,"imported");
 assert.equal(session.running,false);
 assert.deepEqual(chunks,["imported"]);
 assert.equal(statuses.length,1);
 session.stop();
 const newer=session.run("print('new')");
 const fresh=FakeWorker.instances.at(-1);
 old.reply({id:message.id,phase:"done",ok:false,error:"stale"});
 fresh.reply({id:fresh.sent[0].id,phase:"done",ok:true,stdout:"new"});
 assert.equal((await newer).stdout,"new");
 session.dispose();
});
test("Python worker crashes reject all outstanding cells and permit clean restart",async()=>{
 const session=createPythonSession({workerFactory:()=>new FakeWorker()});
 const first=session.run("print(1)"),second=session.run("print(2)");
 const broken=FakeWorker.instances.at(-1);
 broken.onerror({message:"Python Worker crashed"});
 await assert.rejects(first,/crashed/);
 await assert.rejects(second,/crashed/);
 assert.equal(session.running,false);
 assert.equal(broken.terminated,true);
 const recovered=session.run("print(3)");
 const fresh=FakeWorker.instances.at(-1);
 fresh.reply({id:fresh.sent[0].id,phase:"done",ok:true,stdout:"3"});
 assert.equal((await recovered).stdout,"3");
 session.dispose();
});
