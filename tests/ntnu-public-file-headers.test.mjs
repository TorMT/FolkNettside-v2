import test from "node:test";
import assert from "node:assert/strict";
import {
  selectNTNUPublicHeaderSample,auditNTNUPublicHeaders
} from "../scripts/audit_ntnu_file_headers.mjs";

const origin="https://tormt.folk.ntnu.no";
function resource(semester,code,relative){
 const path="/semestre/"+semester+"/"+encodeURIComponent(code)+"/"+
   relative.split("/").map(encodeURIComponent).join("/");
 return {source:"ntnu",relativePath:relative,path,url:origin+path,
  size:0,modified:0};
}
function sample(){
 return {schemaVersion:2,source:"ntnu-auto-preview",semesters:[
  {id:1,courses:[{semester:1,code:"itgk",title:"ITGK",resources:[
    resource(1,"itgk","filer/Øving1/oppgave.ipynb"),
    resource(1,"itgk","filer/intro.py"),
    resource(1,"itgk","filer/Øving2/oppgave.pdf"),
    resource(1,"itgk","quiz/quiz.json")
  ]}]},
  {id:3,courses:[{semester:3,code:"Fluid",title:"Fluid",resources:[
    resource(3,"Fluid","filer/EksamenH24.pdf"),
    resource(3,"Fluid","filer/KateterNotater/def.pdf"),
    resource(3,"Fluid","filer/Arbeidsbok.xlsx")
  ]}]},
  {id:5,courses:[{semester:5,code:"CAD",title:"CAD",resources:[
    resource(5,"CAD","filer/Munin.f3z"),
    resource(5,"CAD","filer/Hull.stl")
  ]}]}
 ]};
}

test("balanced public HEAD sample covers real folder depths and file families",()=>{
 const selected=selectNTNUPublicHeaderSample(sample(),{limit:9});
 assert.equal(selected.length,9);
 assert.deepEqual([...new Set(selected.map(x=>x.semester))],[1,3,5]);
 assert.ok(selected.some(x=>x.format==="IPYNB"&&x.nested));
 assert.ok(selected.some(x=>x.format==="OFFICE"));
 assert.ok(selected.some(x=>x.format==="CAD"));
 assert.ok(selected.some(x=>x.format==="PDF"));
 assert.ok(selected.every(x=>x.url.startsWith(origin+"/semestre/")));
 assert.equal(selectNTNUPublicHeaderSample(sample(),{limit:3}).length,3);
 assert.deepEqual(selectNTNUPublicHeaderSample(sample(),{limit:3}),
   selectNTNUPublicHeaderSample(sample(),{limit:3}));
 for(const limit of [0,-1,41,1.5]){
   assert.throws(()=>selectNTNUPublicHeaderSample(sample(),{limit}),/limit/);
 }
});

test("real network is opt-in: all checks use HEAD, do not redirect or transfer bodies",async()=>{
 const seen=[];
 const report=await auditNTNUPublicHeaders(sample(),{
   limit:9,
   fetchImpl:async(url,options)=>{
     seen.push({url,options});
     assert.equal(options.method,"HEAD");
     assert.equal(options.redirect,"error");
     assert.equal(options.credentials,"omit");
     assert.equal(options.referrerPolicy,"no-referrer");
     assert.ok(options.signal instanceof AbortSignal);
     return {status:200,url};
   }
 });
 assert.equal(seen.length,9);
 assert.equal(report.readOnly,true);
 assert.equal(report.method,"HEAD");
 assert.equal(report.counts.responded,9);
 assert.equal(report.counts.unverified,0);
 assert.equal(report.bySemester[1].checked,4);
 assert.equal(report.bySemester[5].responded,2);
 const safe=JSON.stringify(report);
 assert.ok(!safe.includes("https://"));
 assert.ok(!safe.includes("oppgave"));
 assert.ok(!safe.includes("Munin"));
 assert.ok(!safe.includes("filer/"));
});

test("HEAD server denial, absent file, unsupported method and redirects are distinct",async()=>{
 let i=0;
 const statuses=[200,404,403,405,500,302];
 const checked=await auditNTNUPublicHeaders(sample(),{
   limit:6,
   fetchImpl:async url=>{
     const status=statuses[i++];
     return {status,url:status===302?"https://evil.example/redirect":url};
   }
 });
 assert.equal(checked.counts.responded,1);
 assert.equal(checked.counts.notFound,1);
 assert.equal(checked.counts.accessRestricted,1);
 assert.equal(checked.counts.headUnsupported,1);
 assert.equal(checked.counts.unverified,2);
 assert.equal(checked.selected,6);
});

test("malformed or hidden resource is rejected before any HEAD request",async()=>{
 const mutationList=[
   d=>d.semesters[0].courses[0].resources[0].relativePath="filer/private/secret.pdf",
   d=>d.semesters[0].courses[0].resources[0].url="https://evil.example/foo",
   d=>d.semesters[0].courses[0].resources[0].path="/semestre/1/other/course",
   d=>d.semesters[0].courses[0].resources[0].relativePath="filer/../escape.py"
 ];
 for(const mutation of mutationList){
   const doc=sample();mutation(doc);
   let called=false;
   await assert.rejects(auditNTNUPublicHeaders(doc,{
     fetchImpl:async()=>{called=true;return {status:200};}
   }));
   assert.equal(called,false);
 }
});

test("network errors do not expose paths or become false 404s",async()=>{
 const result=await auditNTNUPublicHeaders(sample(),{
   limit:2,fetchImpl:async url=>{throw Error("Server failed for "+url)}
 });
 assert.equal(result.counts.unverified,2);
 assert.equal(result.counts.notFound,0);
 assert.equal(result.counts.responded,0);
 assert.doesNotMatch(JSON.stringify(result),/Server failed|http|oppgave/i);
});
