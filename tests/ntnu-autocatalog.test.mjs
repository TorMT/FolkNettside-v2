import test from "node:test";
import assert from "node:assert/strict";
import {
 validateNTNUAutoCatalog,loadNTNUAutoCatalog,loadPreferredNTNUCatalog
} from "../src/courses/ntnu-autocatalog.js";
import {NTNU_ORIGIN} from "../src/courses/ntnu-catalog.js";

const sample=()=>({
 schemaVersion:2,source:"ntnu-auto-preview",
 semesters:[{id:5,label:"Semester 5",courses:[{
  semester:5,code:"Marin-Dynamikk",title:"Marin dynamikk",
  resources:[{
   source:"ntnu",name:"Måling.py",label:"Måling",kind:"PY",
   path:"/semestre/5/Marin-Dynamikk/filer/%C3%98ving%201/M%C3%A5ling.py",
   relativePath:"filer/Øving 1/Måling.py",
   url:NTNU_ORIGIN+"/semestre/5/Marin-Dynamikk/filer/%C3%98ving%201/M%C3%A5ling.py",
   size:234,modified:1791911000,section:"filer",folders:["Øving 1"]
  },{
   source:"ntnu",name:"quiz.json",label:"Quiz",kind:"QUIZ",
   path:"/semestre/5/Marin-Dynamikk/quiz/quiz.json",
   relativePath:"quiz/quiz.json",
   url:NTNU_ORIGIN+"/semestre/5/Marin-Dynamikk/quiz/quiz.json",
   size:112,modified:1791911200,section:"quiz",folders:[]
  }]
 }]}]
});

const jsonResponse=(body,ok=true)=>({
 ok,status:ok?200:404,headers:{get:()=>null},
 text:async()=>JSON.stringify(body)
});

test("V2 generated catalog reuses safe NTNU parser, preserving nested Norwegian paths",()=>{
 const manifest=validateNTNUAutoCatalog(sample());
 assert.equal(manifest.source,"ntnu-auto-validated");
 assert.equal(manifest.status,"auto");
 assert.equal(manifest.semesters.length,1);
 const course=manifest.semesters[0].courses[0];
 assert.equal(course.code,"Marin-Dynamikk");
 assert.equal(course.title,"Marin dynamikk");
 assert.equal(course.resources.length,2);
 const python=course.resources.find(x=>x.kind==="PY");
 assert.deepEqual(python.folders,[]);
 assert.equal(python.section,"Øving 1");
 assert.equal(python.size,234);
 assert.equal(python.modified,1791911000);
 assert.ok(python.url.startsWith(NTNU_ORIGIN+"/semestre/5/"));
 assert.equal(course.resources.find(x=>x.kind==="QUIZ").name,"quiz.json");
});

test("reject protected, escaping, remote and untrusted generated catalog entries",()=>{
 const mutate=(fn,pattern)=>{
  const data=sample();fn(data);
  assert.throws(()=>validateNTNUAutoCatalog(data),pattern);
 };
 mutate(x=>x.semesters[0].courses[0].resources[0].relativePath="filer/../secret.py",/Unsafe/);
 mutate(x=>x.semesters[0].courses[0].resources[0].relativePath="filer/beskyttet/private.pdf",/Unsafe/);
 mutate(x=>x.semesters[0].courses[0].resources[0].path="/semestre/1/itkg/secret.py",/Unsafe/);
 mutate(x=>x.semesters[0].courses[0].resources[0].url="https://evil.example/file.py",/Unsafe/);
 mutate(x=>x.semesters[0].courses[0].resources[0].source="external",/Unsafe/);
 mutate(x=>x.semesters[0].courses[0].resources[0].size=-1,/metadata/);
 mutate(x=>x.semesters[0].courses[0].resources.push({...x.semesters[0].courses[0].resources[0]}),/duplicate/);
 mutate(x=>x.semesters[0].courses[0].code="private-module",/course/);
 mutate(x=>x.semesters[0].courses[0].resources[0].relativePath="filer/encoded%2Fslash.py",/Unsafe/);
 mutate(x=>x.semesters.push({...x.semesters[0]}),/semester/);
 mutate(x=>x.source="untrusted-catalog",/schema/);
 assert.throws(()=>validateNTNUAutoCatalog(sample(),{origin:"https://evil.invalid"}),/origin/);
});

test("loader stays on same-origin V2 data endpoint and accepts valid JSON only",async()=>{
 const seen=[];
 const fetchImpl=async(url,options)=>{
  seen.push({url,options});return jsonResponse(sample());
 };
 const result=await loadNTNUAutoCatalog({fetchImpl});
 assert.equal(result.status,"auto");
 assert.deepEqual(seen.map(x=>x.url),["./data/ntnu-autocatalog.json"]);
 assert.equal(seen[0].options.mode,"same-origin");
 assert.equal(seen[0].options.credentials,"same-origin");
 assert.equal(seen[0].options.redirect,"error");
});

test("if catalog is missing, legacy semester indexes remain fully usable",async()=>{
 const called=[];
 const fetchImpl=async(url)=>{
  called.push(url);
  if(url==="./data/ntnu-autocatalog.json")
   return {ok:false,status:404,headers:{get:()=>null}};
  const path=new URL(url).pathname;
  if(path==="/semestre/index.json")
   return jsonResponse({"5":{dir:"5",beskyttet:false}});
  return jsonResponse({
   "Marin-Dynamikk":{dir:"Marin-Dynamikk",beskyttet:false,
    files:["filer/Øving 1/Måling.py"]}
  });
 };
 const result=await loadPreferredNTNUCatalog({fetchImpl});
 assert.equal(result.source,"legacy");
 assert.equal(result.fallback,true);
 assert.equal(result.manifest.status,"live");
 assert.equal(result.manifest.semesters[0].courses[0].resources[0].kind,"PY");
 assert.equal(called.length,3);
});

test("malformed or oversized auto-index uses legacy fallback instead of fake preview",async()=>{
 for(const response of [
  {ok:true,headers:{get:()=>String(9_000_000)},text:async()=>JSON.stringify(sample())},
  {ok:true,headers:{get:()=>null},text:async()=>"{BAD"},
  jsonResponse({...sample(),schemaVersion:99})
 ]){
  const fetchImpl=async(url)=>url==="./data/ntnu-autocatalog.json"?
    response:jsonResponse(url.endsWith("/index.json")&&url.endsWith("/semestre/index.json")?
      {"5":{dir:"5",beskyttet:false}}:
      {"Marin-Dynamikk":{dir:"Marin-Dynamikk",beskyttet:false,files:[]}});
  const result=await loadPreferredNTNUCatalog({fetchImpl});
  assert.equal(result.fallback,true);
  assert.equal(result.manifest.source,"ntnu-same-origin");
 }
});

test("when both sources are unavailable, loader fails instead of showing demo fixtures",async()=>{
 await assert.rejects(loadPreferredNTNUCatalog({
  fetchImpl:async()=>({ok:false,status:503,headers:{get:()=>null}})
 }),/NTNU index HTTP/);
});
