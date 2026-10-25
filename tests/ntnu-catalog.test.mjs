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
   "legacyquiz":{dir:"legacyquiz",beskyttet:false,
     files:["quiz/quiz.json","quiz/quiz_elmag.json","quiz/bilder/images_attribution.json"]},
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
 assert.equal(result.courses.length,3);
 const quizCourse=result.courses.find(x=>x.code==="legacyquiz");
 assert.deepEqual(quizCourse.resources.filter(x=>x.kind==="QUIZ")
   .map(x=>x.name).sort(),["quiz.json","quiz_elmag.json"]);
 assert.ok(quizCourse.resources.some(x=>x.name==="images_attribution.json"&&x.kind==="JSON"));
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
test("unknown or malformed NTNU public status is excluded from legacy resources",()=>{
 const raw={
  approved:{dir:"approved",beskyttet:false,files:["filer/public.pdf"]},
  missing:{dir:"missing",files:["filer/unreviewed.pdf"]},
  stringFlag:{dir:"stringFlag",beskyttet:"false",files:["filer/unreviewed.pdf"]},
  nullFlag:{dir:"nullFlag",beskyttet:null,files:["filer/unreviewed.pdf"]},
  denied:{dir:"denied",beskyttet:true,files:["filer/unreviewed.pdf"]}
 };
 const parsed=parseNTNUSemesterIndex(5,raw);
 assert.deepEqual(parsed.courses.map(x=>x.code),["approved"]);
 assert.equal(parsed.courses[0].resources[0].name,"public.pdf");
});
test("root semester access must be explicitly false before fetching files",async()=>{
 const root={
  "1":{dir:"1",files:[]},
  "2":{dir:"2",beskyttet:"false",files:[]},
  "3":{dir:"3",beskyttet:true,files:[]},
  "4":{dir:"4",beskyttet:false,files:[]}
 };
 const requested=[];
 const fetchImpl=async url=>{
  const path=new URL(url).pathname;
  requested.push(path);
  return {ok:true,status:200,text:async()=>JSON.stringify(
    path==="/semestre/index.json"?root:
      {test:{dir:"test",beskyttet:false,files:["filer/public.pdf"]}}
  )};
 };
 const out=await loadNTNUCatalog({fetchImpl});
 assert.deepEqual(requested,["/semestre/index.json","/semestre/4/index.json"]);
 assert.deepEqual(out.semesters.map(x=>x.id),[4]);
 assert.deepEqual(out.semesters[0].courses.map(x=>x.code),["test"]);
 await assert.rejects(loadNTNUCatalog({fetchImpl:async()=>({
  ok:true,text:async()=>JSON.stringify({"1":{dir:"1",files:[]}})
 })}),/no public semesters/);
});
test("real NTNU quiz metadata outside files becomes a QUIZ resource once",()=>{
 const source={
  exphil:{
   dir:"exphil",beskyttet:false,files:["filer/kapittel.pdf"],
   quiz:"quiz/quiz.json",welcome:"/img/welcome-generic.svg"
  },
  itgk:{
   dir:"itgk",beskyttet:false,
   files:["filer/svar.py","quiz/quiz.json"],
   quiz:"quiz/quiz.json"
  },
  fromQuizOnly:{
   dir:"fromQuizOnly",beskyttet:false,quiz:"quiz/quiz.json"
  },
  blocked:{
   dir:"blocked",beskyttet:true,
   files:["filer/hidden.pdf"],quiz:"quiz/quiz.json"
  },
  hostile:{
   dir:"hostile",beskyttet:false,
   files:[],quiz:"quiz/../../hidden.json"
  }
 };
 const result=parseNTNUSemesterIndex(1,source);
 const by=code=>result.courses.find(c=>c.code===code)?.resources||[];
 assert.equal(by("exphil").length,2);
 assert.equal(by("exphil").filter(x=>x.kind==="QUIZ").length,1);
 assert.equal(by("itgk").length,2,"Duplicate quiz references must collapse");
 assert.equal(by("fromQuizOnly").length,1);
 assert.equal(by("fromQuizOnly")[0].kind,"QUIZ");
 assert.equal(by("blocked").length,0);
 assert.equal(by("hostile").length,0);
 assert.equal(by("exphil").find(x=>x.kind==="QUIZ").path,
  "/semestre/1/exphil/quiz/quiz.json");
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
     {"1":{dir:"1",files:[],beskyttet:false},"5":{dir:"5",files:[],beskyttet:false}}:
     {"marin-maskineri":{dir:"marin-maskineri",files:[],beskyttet:false}};
   return {ok:true,text:async()=>JSON.stringify(body)};
 };
 const r=await loadNTNUCatalog({fetchImpl});
 assert.equal(r.status,"partial");
 assert.deepEqual(r.failedSemesters,[1]);
 assert.deepEqual(r.semesters.map(x=>x.id),[5]);
 await assert.rejects(loadNTNUCatalog({origin:"https://evil.example",fetchImpl}),/Unexpected/);
});

test("public legacy NTNU metadata preserves engineering/media files supported by their viewers",async()=>{
 const {viewerKind}=await import("../src/viewers/registry.js");
 const cases=[
  ["Gears.Z12","Z12","kisssoft"],
  ["Gears.Z014","Z014","kisssoft"],
  ["Assembly.KSYS","KSYS","kisssoft"],
  ["Hull.GLTF","GLTF","gltf"],
  ["Hull.BREP","BREP","cad"],
  ["Drawing.DXF","DXF","conversion"],
  ["Hydro.MP3","AUDIO","audio"],
  ["Sensor.JSONL","JSONL","text"],
  ["Lecture.MKV","VIDEO","video"],
  ["Sheet.TSV","TSV","csv"]
 ];
 const raw={testcourse:{dir:"testcourse",beskyttet:false,
  files:[...cases.map(([name])=>"filer/"+name),
   "filer/private-gear.Z12","filer/.env","filer/unsafe.exe"]}};
 const result=parseNTNUSemesterIndex(5,raw);
 const resources=result.courses[0].resources;
 for(const [name,kind,adapter] of cases){
   const file=resources.find(item=>item.name===name);
   assert.ok(file,name+" should stay indexed for V2");
   assert.equal(file.kind,kind,name);
   assert.equal(viewerKind(file),adapter,name);
 }
 assert.ok(!resources.some(file=>file.name==="private-gear.Z12"||file.name===".env"));
});
