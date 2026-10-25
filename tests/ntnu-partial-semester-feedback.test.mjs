import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadNTNUCatalog} from "../src/courses/ntnu-catalog.js";
import {
 failedNTNUSemesters,initialCourseSemester,courseCatalogWarningHTML,emptySemesterHTML
} from "../src/courses/course-catalog-availability.js";

const siteSemesters=[
 {id:1,label:"Semester 1",courses:[]},
 {id:2,label:"Semester 2",courses:[]},
 {id:3,label:"Semester 3",courses:[]},
 {id:4,label:"Semester 4",courses:[]},
 {id:5,label:"Semester 5",courses:[]}
];

test("partial NTNU failure retains all working courses, reports exact public semester IDs",async()=>{
 const requests=[];
 const root={
  "1":{dir:"1",beskyttet:false},
  "2":{dir:"2",beskyttet:false},
  "3":{dir:"3",beskyttet:false},
  "4":{dir:"4",beskyttet:"false"},
  "5":{dir:"5",beskyttet:true}
 };
 const fetchImpl=async url=>{
  const path=new URL(url).pathname;
  requests.push(path);
  if(path==="/semestre/2/index.json")return {ok:false,status:503};
  if(path==="/semestre/index.json")
    return {ok:true,status:200,headers:{get:()=>null},
      text:async()=>JSON.stringify(root)};
  const sid=Number(path.match(/^\/semestre\/(\d+)\/index\.json$/)?.[1]);
  return {ok:true,status:200,headers:{get:()=>null},
    text:async()=>JSON.stringify({
      ["course"+sid]:{dir:"course"+sid,beskyttet:false,
        files:["filer/Øving 1/solver.py","filer/forelesning.pdf"]}
    })};
 };
 const manifest=await loadNTNUCatalog({fetchImpl});
 assert.equal(manifest.status,"partial");
 assert.deepEqual(manifest.failedSemesters,[2]);
 assert.deepEqual(manifest.semesters.map(s=>s.id),[1,3]);
 assert.deepEqual(manifest.semesters.flatMap(s=>s.courses).map(c=>c.code),
   ["course1","course3"]);
 assert.equal(manifest.semesters.flatMap(s=>s.courses).flatMap(c=>c.resources).length,4);
 assert.deepEqual(requests,[
  "/semestre/index.json",
  "/semestre/1/index.json",
  "/semestre/2/index.json",
  "/semestre/3/index.json"
 ]);
 const source={mode:"ntnu",status:manifest.status,failedSemesters:manifest.failedSemesters};
 const display=siteSemesters.map(semester=>manifest.semesters.find(s=>s.id===semester.id)||semester);
 const banner=courseCatalogWarningHTML(source);
 assert.match(banner,/S2/);
 assert.match(banner,/Fag fra semestre som kunne leses, vises fortsatt/);
 assert.doesNotMatch(banner,/course1|solver\.py|semester.*4.*utilgjengelig/);
 assert.equal(initialCourseSemester(display,source,{preferred:2}),1);
 assert.equal(initialCourseSemester(display,source,{requested:2,preferred:1}),2);
 assert.match(emptySemesterHTML(display[1],source),/Semester 2 kunne ikke oppdateres/);
 assert.doesNotMatch(emptySemesterHTML(display[1],source),/Ingen offentlige fag registrert/);
 assert.match(emptySemesterHTML(display[3],source),/Ingen offentlige fag registrert/);
});

test("explicit navigation works but initial overview avoids failed default semester",()=>{
 const semesters=siteSemesters.map(s=>({...s,courses:
   s.id===3?[{code:"third"}]:s.id===4?[{code:"fourth"}]:[]}));
 const source={mode:"ntnu",status:"partial",failedSemesters:[1,2,5]};
 assert.equal(initialCourseSemester(semesters,source,{preferred:5}),3);
 assert.equal(initialCourseSemester(semesters,source,{requested:5,preferred:3}),5);
 assert.equal(initialCourseSemester(semesters,source,{requested:4,preferred:3}),4);
 assert.equal(initialCourseSemester(semesters,source,{preferred:4}),4);
 assert.equal(initialCourseSemester(semesters,{mode:"preview",status:"demo"},{preferred:4}),4);
});

test("strictly validated semester labels cannot inject HTML or claim blocked folders failed",()=>{
 const source={
  mode:"ntnu",status:"partial",
  failedSemesters:[4,"5",0,2,2,21,-1,NaN,
    '<img src=x onerror=alert(1)>',true,5.5]
 };
 assert.deepEqual(failedNTNUSemesters(source),[2,4]);
 const banner=courseCatalogWarningHTML(source);
 assert.match(banner,/S2, S4/);
 assert.doesNotMatch(banner,/onerror|img|S0|S21/);
 assert.equal(courseCatalogWarningHTML({...source,mode:"preview"}),"");
 assert.equal(courseCatalogWarningHTML({...source,status:"live"}),"");
 assert.deepEqual(failedNTNUSemesters({...source,status:"unavailable"}),[]);
 const down=courseCatalogWarningHTML({mode:"ntnu",status:"unavailable"});
 assert.match(down,/kunne ikke lastes/);
 assert.doesNotMatch(down,/S2/);
});

test("working and failed empty states differ without caching stale public references",()=>{
 assert.match(emptySemesterHTML(siteSemesters[0],{mode:"preview",status:"demo"}),/eksempeldata/);
 assert.match(emptySemesterHTML(siteSemesters[0],{mode:"ntnu",status:"live"}),/Ingen offentlige fag/);
 assert.match(emptySemesterHTML(siteSemesters[0],{mode:"ntnu",status:"unavailable"}),/midlertidig utilgjengelige/);
 const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../assets/style.css",import.meta.url),"utf8");
 assert.match(app,/courseCatalogWarningHTML\(courseSource\)/);
 assert.match(app,/initialCourseSemester\(semesters,courseSource/);
 assert.match(app,/emptySemesterHTML\(semester,courseSource\)/);
 assert.match(app,/semester-tab-unavailable/);
 assert.match(app,/aria-label="\$\{escCourse\(s\.label\+status\)\}"/);
 assert.match(css,/\.semester-tab-issue/);
 assert.match(css,/max-width:640px/);
 assert.match(css,/\.course-source-warning/);
});
