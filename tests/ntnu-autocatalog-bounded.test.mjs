import test from "node:test";
import assert from "node:assert/strict";
import {
 loadNTNUAutoCatalog,loadPreferredNTNUCatalog
} from "../src/courses/ntnu-autocatalog.js";
import {NTNU_ORIGIN} from "../src/courses/ntnu-catalog.js";

const coursePath="/semestre/5/itgk/filer/%C3%98ving/M%C3%A5ling.py";
const fixture=()=>({
 schemaVersion:2,source:"ntnu-auto-preview",
 semesters:[{id:5,courses:[{
   semester:5,code:"itgk",title:"Øving i ITGK",
   resources:[{
     source:"ntnu",relativePath:"filer/Øving/Måling.py",
     path:coursePath,url:NTNU_ORIGIN+coursePath,size:100,modified:0
   }]
 }]}]
});

test("auto-index streams multibyte Norwegian metadata safely",async()=>{
 const json=new TextEncoder().encode(JSON.stringify(fixture()));
 const split=json.findIndex(byte=>byte===0xc3)+1;
 assert.ok(split>0);
 const result=await loadNTNUAutoCatalog({fetchImpl:async()=>({
   ok:true,status:200,headers:{get:()=>null},
   body:new ReadableStream({start(controller){
     controller.enqueue(json.subarray(0,split));
     controller.enqueue(json.subarray(split));
     controller.close();
   }}),
   text:async()=>{throw Error("Should not buffer full response")}
 })});
 assert.equal(result.source,"ntnu-auto-validated");
 assert.equal(result.semesters[0].courses[0].resources[0].name,"Måling.py");
});

test("auto-index with oversized declared size is rejected without buffering",async()=>{
 let read=false;
 await assert.rejects(loadNTNUAutoCatalog({fetchImpl:async()=>({
   ok:true,status:200,headers:{get:()=>String(4_000_001)},
   text:async()=>{read=true;return JSON.stringify(fixture())}
 })}),/exceeds safety limit/);
 assert.equal(read,false);
});

test("auto-index streamed overflow cancels its reader and keeps legacy fallback",async()=>{
 let cancelled=false,released=false;
 const fetchImpl=async url=>{
   if(url==="./data/ntnu-autocatalog.json")
     return {ok:true,status:200,headers:{get:()=>null},
       body:{getReader:()=>({
         read:async()=>({done:false,value:new Uint8Array(4_000_001)}),
         cancel:async()=>{cancelled=true},
         releaseLock:()=>{released=true}
       })}};
   const path=new URL(url).pathname;
   const data=path==="/semestre/index.json"?
     {"5":{dir:"5",beskyttet:false}}:
     {"itgk":{dir:"itgk",beskyttet:false,
       files:["filer/Øving/Måling.py"]}};
   return {ok:true,status:200,headers:{get:()=>null},
     text:async()=>JSON.stringify(data)};
 };
 const result=await loadPreferredNTNUCatalog({fetchImpl});
 assert.equal(result.fallback,true);
 assert.equal(result.manifest.source,"ntnu-same-origin");
 assert.equal(result.manifest.semesters[0].courses[0].resources[0].name,"Måling.py");
 assert.equal(cancelled,true);
 assert.equal(released,true);
});
