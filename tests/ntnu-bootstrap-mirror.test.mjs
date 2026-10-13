import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";
import {asRemoteNTNUManifest} from "../src/content.js";

const catalog=JSON.parse(readFileSync(
 new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
const cfg=JSON.parse(readFileSync(
 new URL("../config/ntnu-public-courses.json",import.meta.url),"utf8"));

test("real public NTNU S1-S5 folders appear as non-demo V2 semester course cards",()=>{
 const validated=validateNTNUAutoCatalog(catalog);
 const expected=[1,2,3,4,5];
 assert.deepEqual(validated.semesters.map(s=>s.id),expected);
 const counts=validated.semesters.map(s=>s.courses.length);
 assert.deepEqual(counts,[3,5,6,5,5]);
 const n=validated.semesters.reduce((total,s)=>total+s.courses.reduce(
  (files,c)=>files+c.resources.length,0),0);
 assert.ok(n>=400,"All existing publicly approved course resources should appear");
 assert.equal(cfg.publicCourses.length,24);
 assert.equal(validated.semesters.flatMap(s=>s.courses).length,24);
 for(const {semester,slug} of cfg.publicCourses){
  const course=validated.semesters.find(s=>s.id===semester)?.courses
    .find(c=>c.code===slug);
  assert.ok(course,"Missing public semester folder: "+semester+"/"+slug);
  assert.equal(course.source,undefined);
 }
});

test("no protected or hidden V1 content can leak into Pages public references",()=>{
 const raw=JSON.stringify(catalog);
 assert.doesNotMatch(raw,/beskyttet|protected|private|privat|restricted|hemmelig|secret|credential|passord|password|token|\\.env/i);
 for(const sem of catalog.semesters){
  for(const course of sem.courses){
   for(const r of course.resources){
    assert.equal(r.source,"ntnu");
    assert.equal(r.path.startsWith("/semestre/"+sem.id+"/"),true);
    assert.equal(r.url,"https://tormt.folk.ntnu.no"+r.path);
    assert.equal(r.relativePath.startsWith("filer/")||
      r.relativePath.startsWith("quiz/"),true);
    assert.equal(r.path.includes(".."),false);
   }
  }
 }
});

test("new GitHub Pages course view points to NTNU resources without copying bytes",()=>{
 const validated=validateNTNUAutoCatalog(catalog);
 const remote=asRemoteNTNUManifest(validated);
 const resources=remote.semesters.flatMap(s=>s.courses.flatMap(c=>c.resources));
 assert.ok(resources.length>=400);
 assert.ok(resources.every(r=>r.path.startsWith("https://tormt.folk.ntnu.no/semestre/")));
 assert.ok(resources.every(r=>r.remoteArchive===true));
 const previews=remote.semesters.find(s=>s.id===1).courses;
 assert.equal(previews.length,3);
 assert.ok(previews.some(c=>c.resources.some(r=>r.kind==="QUIZ")));
 assert.ok(previews.some(c=>c.resources.some(r=>r.kind==="IPYNB")));
});
