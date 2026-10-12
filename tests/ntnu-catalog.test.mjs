import test from "node:test";
import assert from "node:assert/strict";
import {
 NTNU_ORIGIN,onNTNUHost,parseNTNUSemesterIndex,loadNTNUCatalog
} from "../src/courses/ntnu-catalog.js";

test("NTNU-only same-origin mode never runs on Pages preview or arbitrary domains",()=>{
 assert.equal(onNTNUHost("tormt.folk.ntnu.no"),true);
 for(const other of ["tormt.github.io","evil.tormt.folk.ntnu.no",
   "folk.ntnu.no","localhost","tormt.folk.ntnu.no.evil.example"]){
   assert.equal(onNTNUHost(other),false);
 }
});
test("semester 5 index preserves nested course files without copying bytes",()=>{
 const raw={
   welcome:"/img/welcome-generic.svg",
   "Marin-Dynamikk":{
     dir:"Marin-Dynamikk",beskyttet:false,
     files:[
       "filer/Øving1/Forarbeid.pdf",
       "filer/Øving3/const_avg_acc.py",
       "filer/Øving3/NyVersjon/solver.py",
       "filer/Øving3/NyVersjon/solver.py",
       "filer/Ekstra(beskyttet)/Private notes.pdf",
       "filer/Ekstra (Beskyttet)/Secret.zip",
       "filer/../secrets.pdf",
       "filer/%2e%2e/escape.py",
       "filer/C:\\windows.ini",
       "filer/~$temporary.xlsx",
       "filer/test#frag.pdf",
       "filer/.env",
       "filer/quiz/quiz.json"
     ]
   },
   "other-public":{dir:"other-public",beskyttet:false,files:[]},
   hidden:{dir:"hidden",beskyttet:true,files:["filer/valid.pdf"]},
   mismatch:{dir:"malicious",beskyttet:false,files:["filer/data.csv"]}
 };
 const result=parseNTNUSemesterIndex(5,raw);
 assert.equal(result.id,5);
 assert.equal(result.courses.length,2);
 const item=result.courses.find(x=>x.code==="Marin-Dynamikk");
 assert.equal(item.resources.length,4);
 assert.deepEqual(item.resources.map(x=>x.section).sort(),
   ["quiz","Øving1","Øving3","Øving3"].sort());
 const nested=item.resources.find(x=>x.name==="solver.py");
 assert.deepEqual(nested.folders,["NyVersjon"]);
 assert.equal(nested.kind,"PY");
 assert.equal(nested.source,"ntnu");
 assert.equal(nested.url,
   NTNU_ORIGIN+"/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/NyVersjon/solver.py");
 assert.ok(item.resources.every(x=>x.url.startsWith(NTNU_ORIGIN+"/semestre/5/")));
 assert.ok(!JSON.stringify(result).includes("Private notes"));
 assert.ok(!JSON.stringify(result).includes("Secret.zip"));
});
test("public navbar labels can be supplied without changing stable route slugs",()=>{
 const result=parseNTNUSemesterIndex(5,{
   "marin-teknikk-4-propulsjon":{dir:"marin-teknikk-4-propulsjon",
     files:["filer/Prosjekt/beregninger.csv"],beskyttet:false}
 },{titles:new Map([["5:marin-teknikk-4-propulsjon",
   "Marin teknikk 4 - Propulsjonssystemer"]])});
 assert.equal(result.courses[0].code,"marin-teknikk-4-propulsjon");
 assert.equal(result.courses[0].title,"Marin teknikk 4 - Propulsjonssystemer");
});
test("real directory index shape is loaded, not the sparse top-level S5 index",async()=>{
 const responses=new Map([
  ["/semestre/index.json",{
    welcome:"/img/welcome-generic.svg",
    "1":{dir:"1",files:["itgk/filer/some.pdf"],beskyttet:false},
    "5":{dir:"5",files:["marin-maskineri/index.json"],beskyttet:false}
  }],
  ["/semestre/1/index.json",{
    itgk:{dir:"itgk",files:["filer/Øving1/test.ipynb"],beskyttet:false}
  }],
  ["/semestre/5/index.json",{
    "Marin-Dynamikk":{dir:"Marin-Dynamikk",beskyttet:false,
      files:["filer/Øving1/Forarbeid.pdf","filer/Øving4/solver.py"]},
    "teknologiledelse":{dir:"teknologiledelse",beskyttet:false,files:[]}
  }]
 ]);
 const fetched=[];
 const fetchImpl=async(u,opts)=>{
  const url=new URL(u);
  assert.equal(url.origin,NTNU_ORIGIN);
  assert.equal(opts.credentials,"same-origin");
  assert.equal(opts.mode,"same-origin");
  fetched.push(url.pathname);
  const payload=responses.get(url.pathname);
  return {ok:!!payload,status:payload?200:404,
    text:async()=>JSON.stringify(payload)};
 };
 const manifest=await loadNTNUCatalog({fetchImpl});
 assert.equal(manifest.source,"ntnu-same-origin");
 assert.equal(manifest.status,"live");
 assert.deepEqual(fetched.sort(),[...responses.keys()].sort());
 assert.equal(manifest.semesters.length,2);
 assert.equal(manifest.semesters[1].courses.length,2);
 assert.equal(manifest.semesters[1].courses[0].resources.length,2);
});
test("inaccessible semester is marked partial, never substituted with demo files",async()=>{
 const fetchImpl=async(u)=>{
   const path=new URL(u).pathname;
   if(path==="/semestre/1/index.json")return {ok:false,status:403};
   const body=path==="/semestre/index.json"?
     {"1":{dir:"1",files:[]},"5":{dir:"5",files:[]}}:
     {"marin-maskineri":{dir:"marin-maskineri",files:[],beskyttet:false}};
   return {ok:true,text:async()=>JSON.stringify(body)};
 };
 const r=await loadNTNUCatalog({fetchImpl});
 assert.equal(r.status,"partial");
 assert.deepEqual(r.failedSemesters,[1]);
 assert.deepEqual(r.semesters.map(x=>x.id),[5]);
 await assert.rejects(loadNTNUCatalog({origin:"https://evil.example",fetchImpl}),/Unexpected/);
});
