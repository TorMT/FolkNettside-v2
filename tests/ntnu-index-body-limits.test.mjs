import test from "node:test";
import assert from "node:assert/strict";
import {loadNTNUCatalog} from "../src/courses/ntnu-catalog.js";

const jsonResponse=data=>({
 ok:true,status:200,headers:{get:()=>null},
 text:async()=>JSON.stringify(data)
});
const approvedRoot={
 "5":{dir:"5",beskyttet:false}
};

test("NTNU JSON index streams decode Norwegian paths across UTF-8 chunk boundaries",async()=>{
 const semester={
  "øving":{dir:"øving",beskyttet:false,files:["filer/Øving/Spørsmål.py"]}
 };
 const json=new TextEncoder().encode(JSON.stringify(semester));
 const split=json.findIndex((byte,i)=>byte===0xc3&&json[i+1]===0xb8)+1;
 assert.ok(split>0,"fixture must split an encoded Norwegian character");
 const fetchImpl=async url=>{
   if(new URL(url).pathname==="/semestre/index.json")
     return jsonResponse(approvedRoot);
   return {
     ok:true,status:200,headers:{get:()=>null},
     body:new ReadableStream({start(controller){
       controller.enqueue(json.subarray(0,split));
       controller.enqueue(json.subarray(split));
       controller.close();
     }}),
     text:async()=>{throw Error("Streaming response should not call text()")}
   };
 };
 const catalog=await loadNTNUCatalog({fetchImpl});
 assert.equal(catalog.status,"live");
 assert.equal(catalog.semesters[0].courses[0].code,"øving");
 assert.equal(catalog.semesters[0].courses[0].resources[0].name,"Spørsmål.py");
});

test("oversized advertised Content-Length is rejected before reading",async()=>{
 let wasRead=false;
 await assert.rejects(loadNTNUCatalog({fetchImpl:async()=>({
   ok:true,status:200,headers:{get:name=>
     name==="content-length"?"4000001":null},
   text:async()=>{wasRead=true;return "{}";}
 })}),/exceeds safety limit/);
 assert.equal(wasRead,false);
});

test("oversized streamed index cancels its reader before parsing",async()=>{
 let cancelled=false,released=false;
 const fetchImpl=async()=>({
  ok:true,status:200,headers:{get:()=>null},
  body:{getReader:()=>({
    read:async()=>({done:false,value:new Uint8Array(4_000_001)}),
    cancel:async()=>{cancelled=true},
    releaseLock:()=>{released=true}
  })}
 });
 await assert.rejects(loadNTNUCatalog({fetchImpl}),/exceeds safety limit/);
 assert.equal(cancelled,true);
 assert.equal(released,true);
});

test("oversized UTF-8 body without streaming is rejected by byte count",async()=>{
 const oversized="ø".repeat(2_000_001);
 await assert.rejects(loadNTNUCatalog({fetchImpl:async()=>({
   ok:true,status:200,headers:{get:()=>null},
   text:async()=>oversized
 })}),/exceeds safety limit/);
});

test("bad semester index becomes partial without showing demo data",async()=>{
 const fetchImpl=async url=>{
  const path=new URL(url).pathname;
  if(path==="/semestre/index.json")
    return jsonResponse({
      "1":{dir:"1",beskyttet:false},
      "5":{dir:"5",beskyttet:false}
    });
  if(path==="/semestre/1/index.json")
    return {
      ok:true,status:200,headers:{get:()=>null},
      body:new ReadableStream({start(controller){
        controller.enqueue(new Uint8Array([0x7b,0xc3,0x28,0x7d]));
        controller.close();
      }})
    };
  return jsonResponse({
    publicCourse:{dir:"publicCourse",beskyttet:false,
      files:["filer/open.pdf"]}
  });
 };
 const result=await loadNTNUCatalog({fetchImpl});
 assert.equal(result.status,"partial");
 assert.deepEqual(result.failedSemesters,[1]);
 assert.deepEqual(result.semesters.map(semester=>semester.id),[5]);
 assert.equal(result.semesters[0].courses[0].resources[0].name,"open.pdf");
});
