import test from "node:test";
import assert from "node:assert/strict";
import {summarizeSemester,summarizeRoot} from "../scripts/audit_ntnu_catalog.mjs";

test("public index audit summarizes real viewer kinds without exposing paths",()=>{
 const raw={
  welcome:"welcome.png",
  itgk:{dir:"itgk",beskyttet:false,files:[
   "filer/Oeving1/test.ipynb",
   "filer/Oeving1/readme.pdf",
   "quiz/quiz.json",
   "filer/Oeving1/data.bin",
   "filer/../private/config.json",
   "filer/secret/token.json"
  ]},
  "ITGK (beskyttet)":{dir:"ITGK (beskyttet)",beskyttet:true,
    files:["filer/TOP-SECRET-MATERIAL.pdf"]},
  bad:{dir:"other",beskyttet:false,files:["filer/test.pdf"]}
 };
 const result=summarizeSemester(1,raw);
 assert.equal(result.courses,1);
 assert.equal(result.visibleResources,4);
 assert.equal(result.publicIndexEntries,7);
 assert.equal(result.skippedEntries,3);
 assert.equal(result.protectedCourseDirectories,1);
 assert.equal(result.withoutNativePreview,1);
 assert.equal(result.viewerFormats.notebook,1);
 assert.equal(result.viewerFormats.pdf,1);
 assert.equal(result.viewerFormats.quiz,1);
 assert.equal(result.viewerFormats.unsupported,1);
 const serialized=JSON.stringify(result);
 for(const forbidden of ["TOP-SECRET","token.json","readme.pdf","data.bin","/semestre/"]){
  assert.ok(!serialized.includes(forbidden),forbidden);
 }
});

test("index audit counts separate quiz metadata and skips duplicate quiz paths",()=>{
 const source={
   exphil:{dir:"exphil",files:["filer/readme.pdf"],quiz:"quiz/quiz.json"},
   itgk:{dir:"itgk",files:["quiz/quiz.json"],quiz:"quiz/quiz.json"},
   nofile:{dir:"nofile",quiz:"quiz/quiz.json"}
 };
 const result=summarizeSemester(1,source);
 assert.equal(result.publicIndexEntries,4);
 assert.equal(result.visibleResources,4);
 assert.equal(result.viewerFormats.quiz,3);
 assert.equal(result.skippedEntries,0);
});

test("partial public semester indexes produce an explicit unavailable state",()=>{
 const root={"1":{dir:"1",beskyttet:false},"2":{dir:"2",beskyttet:false},
   "3":{dir:"3",beskyttet:false}};
 const data={1:{intro:{dir:"intro",files:["filer/test.pdf"]}},
   3:{empty:{dir:"empty",files:[]}}};
 const summary=summarizeRoot(root,data);
 assert.equal(summary.semesterCount,3);
 assert.equal(summary.availableSemesters,2);
 assert.equal(summary.visibleResources,1);
 assert.deepEqual(summary.semesters.filter(x=>x.unavailable).map(x=>x.semester),[2]);
 assert.equal(summary.readOnly,true);
});
