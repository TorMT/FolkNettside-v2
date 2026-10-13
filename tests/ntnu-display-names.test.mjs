import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyNTNUDisplayNames,validateNTNUDisplayNames}
 from "../src/courses/ntnu-display-names.js";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";
import {asRemoteNTNUManifest} from "../src/content.js";
import {quizStorageKey} from "../src/viewers/quiz-core.js";
import {renderResourceTree} from "../src/components/resource-tree.js";

const original=JSON.parse(readFileSync(new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
const names=JSON.parse(readFileSync(new URL("../config/ntnu-display-names.json",import.meta.url),"utf8"));
const source=()=>validateNTNUAutoCatalog(original);

test("friendly course labels show original NTNU slug and keep all 24 public subjects",()=>{
 const before=source(),after=applyNTNUDisplayNames(before,names);
 const courses=after.semesters.flatMap(s=>s.courses);
 assert.equal(courses.length,24);
 assert.equal(after.semesters.length,5);
 assert.equal(after.semesters[0].courses.find(x=>x.code==="exphil").title,"Ex.phil.");
 const marin=after.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk");
 assert.equal(marin.title,"Marin dynamikk");
 assert.equal(marin.code,"Marin-Dynamikk");
 assert.equal(marin.originalTitle,"Marin Dynamikk");
 assert.equal(before.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk").title,"Marin Dynamikk");
 assert.equal(after.semesters[4].courses.find(x=>x.code==="marin-machinery-design-and-condition-monitoring").title,
  "Marine maskineri – design og tilstandsovervåking");
});

test("file aliases never change relative paths, exact URLs, kind, stable order or progress",()=>{
 const base=asRemoteNTNUManifest(source()),renamed=applyNTNUDisplayNames(base,names);
 const find=(manifest,semester,code,path)=>manifest.semesters.find(x=>x.id===semester).courses
  .find(x=>x.code===code).resources.find(r=>r.relativePath===path);
 const name="filer/Øving3/const_avg_acc.py";
 const before=find(base,5,"Marin-Dynamikk",name),after=find(renamed,5,"Marin-Dynamikk",name);
 assert.ok(before);assert.ok(after);
 assert.equal(after.label,"Konstant gjennomsnittsakselerasjon");
 assert.equal(after.originalLabel,before.label);
 assert.equal(after.name,"const_avg_acc.py");
 assert.equal(after.path,before.path);
 assert.equal(after.url,before.url);
 assert.equal(after.relativePath,name);
 assert.equal(after.kind,before.kind);
 assert.equal(quizStorageKey(after),quizStorageKey(before));
 const startOrder=base.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk").resources.map(x=>x.relativePath);
 const endOrder=renamed.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk").resources.map(x=>x.relativePath);
 assert.deepEqual(endOrder,startOrder);
 const quizBefore=find(base,1,"exphil","quiz/quiz.json");
 const quizAfter=find(renamed,1,"exphil","quiz/quiz.json");
 assert.equal(quizAfter.label,"Øvingsquiz i ex.phil.");
 assert.equal(quizAfter.kind,"QUIZ");
 assert.equal(quizStorageKey(quizAfter),quizStorageKey(quizBefore));
});

test("sections and deep folders are renamed consistently but preserve source metadata",()=>{
 const c=applyNTNUDisplayNames(source(),names).semesters[3].courses.find(x=>x.code==="marin-Hydro");
 const original=c.resources.find(r=>r.relativePath==="filer/Øving3/oppgave2/hastighetsfelt.pdf");
 assert.ok(original);
 assert.equal(original.section,"Øving3");
 assert.equal(original.originalSection,"Øving3");
 assert.deepEqual(original.originalFolders,["oppgave2"]);
 assert.deepEqual(original.folders,["Oppgave 2"]);
 const nested=c.resources.find(r=>r.relativePath==="filer/Øving3/plott/hastighetsfelt.pdf");
 assert.deepEqual(nested.folders,["Plott"]);
 const guide=c.resources.find(r=>r.relativePath==="filer/Øving7/postprocessing.py");
 assert.equal(guide.label,"Etterbehandling – Lab");
 assert.equal(guide.section,"Øving 7 – Lab og etterbehandling");
 assert.ok(c.sections.includes(guide.section));
 const html=renderResourceTree([original],()=>42);
 assert.match(html,/Oppgave 2/);
 assert.match(html,/NTNU: oppgave2/);
 assert.match(html,/hastighetsfelt\.pdf/);
 assert.match(html,/data-resource="42"/);
});

test("unknown or stale file aliases do not invent resources or alter files",()=>{
 const originalManifest=source();
 const config={schemaVersion:1,courses:{"5/Marin-Dynamikk":{title:"Nytt navn"}},
  sections:{},folders:{},
  files:{"5/Marin-Dynamikk/filer/missing.py":"Filen som ikke finnes"}};
 const result=applyNTNUDisplayNames(originalManifest,config);
 const course=result.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk");
 assert.equal(course.title,"Nytt navn");
 assert.ok(!course.resources.some(x=>x.label==="Filen som ikke finnes"));
});

test("malformed, hostile and colliding label maps fail closed",()=>{
 for(const bad of [
  null,{schemaVersion:2},
  {schemaVersion:1,files:{"5/Marin-Dynamikk/filer/../secret.py":"x"}},
  {schemaVersion:1,files:{"5/Marin-Dynamikk/filer/foo.py":"<script>alert(1)</script>"}},
  {schemaVersion:1,courses:{"5/Marin-Dynamikk":{title:"\n"}}},
  {schemaVersion:1,courses:{"5/Marin-Dynamikk":{url:"https://evil.example"}}},
  {schemaVersion:1,folders:{"5/Marin-Dynamikk/filer/%2e%2e":"unsafe"}}
 ])assert.throws(()=>validateNTNUDisplayNames(bad));
 const base=source(),course=base.semesters[4].courses.find(x=>x.code==="Marin-Dynamikk");
 const sections=course.sections;
 assert.ok(sections.length>1);
 assert.throws(()=>applyNTNUDisplayNames(base,{
  schemaVersion:1,sections:{
   ["5/Marin-Dynamikk/"+sections[0]]:"Sammenslått",
   ["5/Marin-Dynamikk/"+sections[1]]:"Sammenslått"
  }
 }),/Duplicate renamed section/);
});

test("UI escapes original filenames even for specially named public resources",()=>{
 const html=renderResourceTree([{
  folders:[],name:'He said "hi".pdf',
  label:"Eksamensnotater",kind:"PDF"
 }],()=>0);
 assert.match(html,/He said &quot;hi&quot;\.pdf/);
 assert.match(html,/Eksamensnotater/);
});
