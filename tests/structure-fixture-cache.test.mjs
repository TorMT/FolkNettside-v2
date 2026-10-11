import test from "node:test";
import assert from "node:assert/strict";
import {loadStructureFixture} from "../src/engineering/structure-panel.js";

test("Structure fixture cache is keyed by input path, not the first loaded example",async()=>{
 const previous=globalThis.fetch;
 const requests=[];
 globalThis.fetch=async path=>{
   requests.push(path);
   return new Response(JSON.stringify({name:String(path)}),{
     status:200,headers:{"Content-Type":"application/json"}
   });
 };
 try{
   const a=loadStructureFixture("./synthetic-structure-A.json");
   const a2=loadStructureFixture("./synthetic-structure-A.json");
   const b=loadStructureFixture("./synthetic-structure-B.json");
   assert.equal(a,a2,"Same fixture should deduplicate a pending download");
   assert.notEqual(a,b,"Different models should never share the same fixture");
   assert.deepEqual(await a,{name:"./synthetic-structure-A.json"});
   assert.deepEqual(await b,{name:"./synthetic-structure-B.json"});
   assert.deepEqual(requests,["./synthetic-structure-A.json","./synthetic-structure-B.json"]);
 }finally{globalThis.fetch=previous}
});

test("Structure fixture can recover from transient network or HTTP failure",async()=>{
 const previous=globalThis.fetch;
 let attempts=0;
 globalThis.fetch=async()=>{
   attempts++;
   if(attempts===1)return new Response("Temporary failure",{status:503});
   return new Response(JSON.stringify({name:"Recovered test model"}),{status:200});
 };
 try{
   await assert.rejects(loadStructureFixture("./synthetic-retry-structure.json"),/HTTP 503/);
   assert.deepEqual(await loadStructureFixture("./synthetic-retry-structure.json"),
     {name:"Recovered test model"});
   assert.equal(attempts,2);
 }finally{globalThis.fetch=previous}
});
