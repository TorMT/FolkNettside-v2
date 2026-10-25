import test from "node:test";
import assert from "node:assert/strict";
import {liveAudit} from "../scripts/audit_ntnu_catalog.mjs";

const response=body=>({
 ok:true,status:200,headers:{get:()=>null},
 text:async()=>JSON.stringify(body)
});

test("live audit never fetches unknown, string-flag or protected semester indexes",async()=>{
 const seen=[];
 const root={
  1:{dir:"1",beskyttet:false},
  2:{dir:"2",beskyttet:true},
  3:{dir:"3"},
  4:{dir:"4",beskyttet:"false"},
  5:{dir:"5",beskyttet:false}
 };
 const fetchImpl=async url=>{
   const path=new URL(url).pathname;
   seen.push(path);
   if(path==="/semestre/index.json")return response(root);
   if(path==="/semestre/1/index.json")
     return response({open:{dir:"open",beskyttet:false,files:["filer/task.py"]}});
   if(path==="/semestre/5/index.json")
     return response({open:{dir:"open",beskyttet:false,files:["filer/Øving 1.pdf"]}});
   throw Error("Audit fetched an unapproved semester index");
 };
 const result=await liveAudit({fetchImpl});
 assert.deepEqual(seen,[
   "/semestre/index.json",
   "/semestre/1/index.json",
   "/semestre/5/index.json"
 ]);
 assert.equal(result.readOnly,true);
 assert.equal(result.semesterCount,2);
 assert.equal(result.availableSemesters,2);
 assert.equal(result.visibleResources,2);
 assert.deepEqual(result.semesters.map(x=>x.semester),[1,5]);
 assert.ok(!JSON.stringify(result).includes("task.py"),"Only summary counts may be returned");
});

test("root index advertises oversized body: audit refuses it before text read",async()=>{
 let read=false;
 await assert.rejects(liveAudit({fetchImpl:async()=>({
   ok:true,status:200,
   headers:{get:key=>key==="content-length"?"4000001":null},
   text:async()=>{read=true;return "{}"}
 })}),/exceeds safety limit/);
 assert.equal(read,false);
});

test("streamed root index overflow cancels download instead of buffering",async()=>{
 let cancelled=false,released=false;
 await assert.rejects(liveAudit({fetchImpl:async()=>({
   ok:true,status:200,headers:{get:()=>null},
   body:{getReader:()=>({
     read:async()=>({done:false,value:new Uint8Array(4_000_001)}),
     cancel:async()=>{cancelled=true},
     releaseLock:()=>{released=true}
   })},
   text:async()=>{throw Error("Must never fully buffer an oversized stream")}
 })}),/exceeds safety limit/);
 assert.equal(cancelled,true);
 assert.equal(released,true);
});

test("corrupt approved semester metadata is unavailable without leaking filenames",async()=>{
 const seen=[];
 const fetchImpl=async url=>{
   const path=new URL(url).pathname;
   seen.push(path);
   if(path==="/semestre/index.json")
     return response({1:{beskyttet:false},5:{beskyttet:false}});
   if(path==="/semestre/1/index.json")
     return response({allowed:{dir:"allowed",beskyttet:false,files:["filer/exercise.pdf"]}});
   if(path==="/semestre/5/index.json")
     return {ok:true,status:200,headers:{get:()=>null},
       body:new ReadableStream({start(controller){
         controller.enqueue(new Uint8Array([0x7b,0xc3,0x28,0x7d]));
         controller.close();
       }})};
   throw Error("Unexpected source");
 };
 const result=await liveAudit({fetchImpl});
 assert.deepEqual(seen,[
   "/semestre/index.json",
   "/semestre/1/index.json",
   "/semestre/5/index.json"
 ]);
 assert.equal(result.availableSemesters,1);
 assert.deepEqual(result.semesters.filter(x=>x.unavailable).map(x=>x.semester),[5]);
 assert.equal(result.visibleResources,1);
 assert.ok(!JSON.stringify(result).includes("exercise.pdf"));
});
