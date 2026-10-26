import test from "node:test";
import assert from "node:assert/strict";
import {loadNTNUCatalog,NTNU_ORIGIN} from "../src/courses/ntnu-catalog.js";
import {loadPreferredNTNUCatalog} from "../src/courses/ntnu-autocatalog.js";

const json=payload=>({
 ok:true,status:200,headers:{get:()=>null},
 text:async()=>JSON.stringify(payload)
});
const root={"1":{dir:"1",beskyttet:false},"2":{dir:"2",beskyttet:false}};
const course=slug=>({
 [slug]:{dir:slug,beskyttet:false,files:["filer/Øving 1/solver.py"]}
});

test("a hung public semester is aborted and working semesters stay visible",async()=>{
 let blockedSignal;
 const seen=[];
 const fetchImpl=(url,options)=>{
   const path=new URL(url).pathname;
   seen.push(path);
   if(path==="/semestre/2/index.json"){
     blockedSignal=options.signal;
     return new Promise(()=>{});
   }
   return Promise.resolve(json(path==="/semestre/index.json"?root:course("course1")));
 };
 const result=await loadNTNUCatalog({fetchImpl,timeoutMs:25});
 assert.equal(result.status,"partial");
 assert.deepEqual(result.failedSemesters,[2]);
 assert.deepEqual(result.semesters.map(x=>x.id),[1]);
 assert.equal(result.semesters[0].courses[0].resources[0].kind,"PY");
 assert.deepEqual(seen.sort(),[
   "/semestre/index.json","/semestre/1/index.json","/semestre/2/index.json"
 ].sort());
 assert.equal(blockedSignal.aborted,true);
});

test("a hung generated catalog falls back to the live, public NTNU indexes",async()=>{
 let generatedSignal;
 const fetchImpl=(url,options)=>{
   if(url==="./data/ntnu-autocatalog.json"){
     generatedSignal=options.signal;
     return new Promise(()=>{});
   }
   const path=new URL(url,NTNU_ORIGIN).pathname;
   return Promise.resolve(json(path==="/semestre/index.json"?
     {"1":root["1"]}:course("course1")));
 };
 const result=await loadPreferredNTNUCatalog({fetchImpl,timeoutMs:25});
 assert.equal(result.fallback,true);
 assert.equal(result.source,"legacy");
 assert.equal(result.manifest.status,"live");
 assert.equal(result.manifest.semesters[0].courses[0].resources.length,1);
 assert.equal(generatedSignal.aborted,true);
});

test("an unresponsive root fails after the bounded deadline instead of hanging",async()=>{
 let rootSignal;
 await assert.rejects(loadNTNUCatalog({
   timeoutMs:25,
   fetchImpl:(_url,{signal})=>{
     rootSignal=signal;
     return new Promise(()=>{});
   }
 }),/timed out/);
 assert.equal(rootSignal.aborted,true);
});

test("invalid timeout configuration is rejected without requesting private URLs",async()=>{
 let called=false;
 await assert.rejects(loadNTNUCatalog({
   timeoutMs:0,
   fetchImpl:()=>{called=true;return Promise.resolve(json(root));}
 }),/Invalid NTNU index timeout/);
 assert.equal(called,false);
});
