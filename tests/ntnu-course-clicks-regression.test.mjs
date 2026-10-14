import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadContent} from "../src/content.js";
import {renderResourceTree} from "../src/components/resource-tree.js";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const site=read("config/site.json"),manifest=read("data/ntnu-autocatalog.json"),
  names=read("config/ntnu-display-names.json");
const fixtures=new Map([
 ["./config/site.json",site],["./data/content-manifest.json",read("data/content-manifest.json")],
 ["./data/demo-model.json",read("data/demo-model.json")],
 ["./data/gunnerus-model.json",read("data/gunnerus-model.json")],
 ["./data/projects.json",read("data/projects.json")],
 ["./data/ntnu-autocatalog.json",manifest],
 ["./config/ntnu-display-names.json",names]
]);

test("GitHub Pages renders courses 1-5 while hiding only the redundant Marint maskineri V2 card",async()=>{
 const oldFetch=globalThis.fetch, oldLocation=globalThis.location;
 globalThis.location={hostname:"tormt.github.io",pathname:"/FolkNettside-v2/"};
 globalThis.fetch=async url=>({ok:true,json:async()=>fixtures.get(url),text:async()=>JSON.stringify(fixtures.get(url)),headers:{get:()=>null}});
 try{
  const result=await loadContent();
  const courseCounts=result.semesters.slice(0,5).map(s=>s.courses.length);
  assert.deepEqual(courseCounts,[3,5,6,5,4]);
  assert.ok(!result.semesters[4].courses.some(c=>c.code==="marin-maskineri"));
  assert.ok(manifest.semesters[4].courses.some(c=>c.code==="marin-maskineri"),
    "Only V2 display should change, not the original public NTNU catalog");
  const course=result.semesters[0].courses.find(c=>c.code==="exphil");
  assert.ok(course?.resources.length>0);
  const html=renderResourceTree(course.resources,r=>course.resources.indexOf(r),{
    routeForResource:i=>"#/viewer/1/exphil/"+i
  });
  assert.match(html,/href="#\/viewer\/1\/exphil\/\d+"/);
  assert.match(html,/resource-original-link/);
  assert.match(html,/tormt\.folk\.ntnu\.no/);
 }finally{globalThis.fetch=oldFetch;globalThis.location=oldLocation}
});

test("viewer provides an actual original-file link when remote preview cannot fetch",()=>{
 const text=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
 assert.match(text,/Forhåndsvisning på GitHub Pages kan være blokkert/);
 assert.match(text,/id="viewer-error-original" target="_blank" rel="noopener noreferrer" href=/);
 assert.doesNotMatch(text,/id="viewer-error-original"\)\?\.addEventListener/);
});
