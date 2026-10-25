import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyNTNUCourseVisibility} from "../src/courses/course-visibility.js";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";
import {renderResourceTree} from "../src/components/resource-tree.js";
import {asRemoteNTNUManifest} from "../src/content.js";

const raw=JSON.parse(readFileSync(new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
const visibility=JSON.parse(readFileSync(new URL("../config/ntnu-course-visibility.json",import.meta.url),"utf8"));
const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/style.css",import.meta.url),"utf8");
const courseTabs=readFileSync(new URL("../src/courses/course-catalog-availability.js",import.meta.url),"utf8");
const source=()=>validateNTNUAutoCatalog(raw);

test("V2 hides only the duplicate Marint maskineri course without modifying NTNU catalog",()=>{
 const before=source();
 const after=applyNTNUCourseVisibility(before,visibility);
 assert.equal(before.semesters[4].courses.length,5);
 assert.equal(after.semesters[4].courses.length,4);
 assert.deepEqual(after.semesters.slice(0,4).map(s=>s.courses.length),[3,5,6,5]);
 assert.equal(after.semesters.flatMap(s=>s.courses).length,23);
 assert.ok(before.semesters[4].courses.find(c=>c.code==="marin-maskineri"));
 assert.ok(!after.semesters[4].courses.find(c=>c.code==="marin-maskineri"));
 assert.ok(after.semesters[4].courses.find(c=>c.code==="marin-machinery-design-and-condition-monitoring"));
 assert.ok(before.semesters[4].courses.find(c=>c.code==="marin-maskineri"));
});

test("visibility config rejects traversal, private keys and duplicate entries",()=>{
 const manifest=source();
 for(const key of ["../secret","5/../private","5/.htaccess","0/itm","5/beskyttet","5/evil%2fgo"]){
  assert.throws(()=>applyNTNUCourseVisibility(manifest,{
   schemaVersion:1,hiddenCourses:[key]}),/Invalid hidden/);
 }
 assert.throws(()=>applyNTNUCourseVisibility(manifest,{
  schemaVersion:1,hiddenCourses:["5/marin-maskineri","5/marin-maskineri"]}),/Invalid hidden/);
});

test("file rows contain safe direct native hash navigation and separate original NTNU links",()=>{
 const manifest=asRemoteNTNUManifest(source());
 const course=manifest.semesters[4].courses.find(c=>c.code==="Marin-Dynamikk");
 const item=course.resources.find(r=>r.relativePath==="filer/Øving3/const_avg_acc.py");
 assert.ok(item);
 const html=renderResourceTree([item],()=>7,{
  routeForResource:index=>"#/viewer/5/Marin-Dynamikk/"+index
 });
 assert.match(html,/resource-source-primary/);
 assert.match(html,/resource-preview-alternate/);
 assert.match(html,/href="#\/viewer\/5\/Marin-Dynamikk\/7"/);
 assert.match(html,/href="https:\/\/tormt\.folk\.ntnu\.no\/semestre\/5\/Marin-Dynamikk\//);
 assert.match(html,/target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(html,/role="button"/);
 assert.match(app,/href="#\$\{courseRoute\(semester\.id,course\.code\)\}"/);
 assert.match(courseTabs,/href="#\/courses\/\$\{id\}"/);
 assert.match(css,/\.course-card\{display:block/);
});

test("invalid and non-NTNU originals never become external original links",()=>{
 const sourceItem={
  source:"ntnu",kind:"PY",label:"safe",name:"demo.py",
  url:"javascript:alert(1)",folders:[],relativePath:"filer/demo.py"
 };
 const html=renderResourceTree([sourceItem],()=>0,{routeForResource:()=>"#/viewer/1/itgk/0"});
 assert.doesNotMatch(html,/resource-original-link/);
 assert.match(html,/resource-viewer-link/);
 const external=renderResourceTree([{...sourceItem,url:"https://evil.example/file.py"}],
  ()=>0,{routeForResource:()=>"#/viewer/1/itgk/0"});
 assert.doesNotMatch(external,/resource-original-link/);
});

test("redundant upstream catalog status banner is absent from normal course UI",()=>{
 const start=app.indexOf("function coursesPage");
 const end=app.indexOf("function coursePage",start);
 const section=app.slice(start,end);
 assert.doesNotMatch(section,/course-source-status/);
 assert.match(section,/courseCatalogWarningHTML\(courseSource\)/);
 assert.match(section,/semesterTabsHTML\(semesters,semester\.id,courseSource\)/);
});
