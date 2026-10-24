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

test("remote Python and notebook files open NTNU original first, with V2 viewer optional",()=>{
 const course=publicManifest.semesters[0].courses.find(c=>c.code==="itgk");
 assert.ok(course);
 const py=course.resources.find(r=>r.name.endsWith(".ipynb"));
 assert.ok(py?.remoteArchive);
 const html=renderResourceTree([py],()=>course.resources.indexOf(py),{
  routeForResource:index=>"#/viewer/1/itgk/"+index
 });
 assert.match(html,/resource-source-primary/);
 assert.match(html,/target="_blank" rel="noopener noreferrer"/);
 assert.match(html,/https:\/\/tormt\.folk\.ntnu\.no\/semestre\/1\/itgk\//);
 assert.match(html,/resource-preview-alternate/);
 assert.match(html,/V2-viser/);
 assert.match(html,/href="#\/viewer\/1\/itgk\/\d+"/);
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
