import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderResourceTree} from "../src/components/resource-tree.js";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";
import {asRemoteNTNUManifest} from "../src/content.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const raw=JSON.parse(read("data/ntnu-autocatalog.json"));
const publicManifest=asRemoteNTNUManifest(validateNTNUAutoCatalog(raw));

test("real migrated course cards have stable navigable V2 course routes",()=>{
 const source=read("src/app.js");
 assert.match(source,/href="#\$\{courseRoute\(semester\.id,course\.code\)\}"/);
 assert.match(source,/if\(course\)return coursePage\(course\.semester,course\.code,course\.sectionIndex\)/);
 assert.match(source,/Åpne original fagside på NTNU/);
 assert.match(source,/href="#\/courses\/\$\{Number\(semesterId\)\}"/);
 assert.match(source,/Ingen offentlige filer registrert/);
});

test("approved NTNU Python and Jupyter files open interactive V2 viewer first",()=>{
 const course=publicManifest.semesters[0].courses.find(c=>c.code==="itgk");
 assert.ok(course);
 for(const ext of [".ipynb",".py"]){
  const source=course.resources.find(r=>r.name.endsWith(ext));
  assert.ok(source?.remoteArchive,ext);
  const html=renderResourceTree([source],()=>0,{routeForResource:i=>"#/viewer/1/itgk/"+i});
  assert.match(html,/class="resource-viewer-link"/);
  assert.match(html,/href="#\/viewer\/1\/itgk\/0"/);
  assert.match(html,/resource-original-link/);
  assert.doesNotMatch(html,/resource-row-direct-first/);
  assert.doesNotMatch(html,/resource-preview-alternate/);
 }
});

test("unapproved NTNU Python files keep direct original as primary until reviewed",()=>{
 const file={kind:"PY",name:"new-unreviewed.py",label:"New code",source:"ntnu",remoteArchive:true,
  url:"https://tormt.folk.ntnu.no/semestre/5/marin-dynamikk/filer/new-unreviewed.py"};
 const html=renderResourceTree([file],()=>0,{routeForResource:i=>"#/viewer/5/marin-dynamikk/"+i});
 assert.match(html,/resource-source-primary/);
 assert.match(html,/resource-preview-alternate/);
});

test("remote KISSsoft course files open the V2 gear viewer first, keeping original links",()=>{
 for(const ext of ["Z12","Z14","Z012RS","Z014RS","W10","KSYS"]){
  const filename="Gearbox."+ext;
  const url="https://tormt.folk.ntnu.no/semestre/5/TMR4330/filer/"+filename;
  const file={name:filename,label:"Pitch gear",kind:"FILE",source:"ntnu",
   remoteArchive:true,path:url,url,folders:[]};
  const html=renderResourceTree([file],()=>0,{
   routeForResource:i=>"#/viewer/5/TMR4330/"+i
  });
  assert.match(html,/class="resource-viewer-link"/,filename);
  assert.match(html,/href="#\/viewer\/5\/TMR4330\/0"/,filename);
  assert.match(html,/resource-original-link/,filename);
  assert.doesNotMatch(html,/resource-row-direct-first/,filename);
  assert.doesNotMatch(html,/resource-preview-alternate/,filename);
 }
});

test("PDF keeps V2 preview primary with source fallback",()=>{
 const course=publicManifest.semesters[0].courses.find(c=>c.code==="exphil");
 const pdf=course.resources.find(r=>r.kind==="PDF");
 const html=renderResourceTree([pdf],()=>0,{routeForResource:i=>"#/viewer/1/exphil/"+i});
 assert.match(html,/class="resource-viewer-link"/);
 assert.match(html,/resource-original-link/);
 assert.doesNotMatch(html,/resource-row-direct-first/);
});

test("unapproved or executable URLs never become remote direct links",()=>{
 const item={source:"ntnu",remoteArchive:true,kind:"PY",name:"script.py",
  label:"Script",url:"javascript:alert(1)",folders:[]};
 const html=renderResourceTree([item],()=>0,{routeForResource:i=>"#/viewer/1/it/"+i});
 assert.doesNotMatch(html,/href="javascript:/);
 assert.doesNotMatch(html,/resource-source-primary/);
});
