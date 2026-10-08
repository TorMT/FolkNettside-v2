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
