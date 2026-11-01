import test from "node:test";
import assert from "node:assert/strict";
import {createPythonSession} from "../src/viewers/python-session.js";

class WorkerStub{
 constructor(){this.messages=[];this.terminated=false}
 postMessage(message){this.messages.push(message)}
 terminate(){this.terminated=true}
 reply(data){this.onmessage?.({data})}
 crash(message){this.onerror?.({message})}
}

test("late crash from stopped Worker cannot cancel a newer Python run",async()=>{
 const workers=[];
 const session=createPythonSession({workerFactory:()=>{
   const worker=new WorkerStub();workers.push(worker);return worker;
 }});
 const first=session.run("while True: pass");
 const old=workers[0];const oldId=old.messages[0].id;
 session.stop();
 await assert.rejects(first,/stopped/);
 const next=session.run("print(42)");
 const current=workers[1],nextId=current.messages[0].id;
 old.reply({id:oldId,phase:"done",ok:false,error:"stale"});
 old.crash("old worker crashed late");
 assert.equal(current.terminated,false);
 assert.equal(session.running,true);
 current.reply({id:nextId,phase:"done",ok:true,stdout:"42"});
 assert.equal((await next).stdout,"42");
 session.dispose();
 assert.equal(current.terminated,true);
});
test("current Worker failure still resets and rejects its active session",async()=>{
 const workers=[];
 const session=createPythonSession({workerFactory:()=>{
   const worker=new WorkerStub();workers.push(worker);return worker;
 }});
 const pending=session.run("raise RuntimeError('x')");
 workers[0].crash("runtime crash");
 await assert.rejects(pending,/runtime crash/);
 assert.equal(workers[0].terminated,true);
 assert.equal(session.running,false);
 session.dispose();
});
