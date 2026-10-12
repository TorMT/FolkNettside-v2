import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const projects=JSON.parse(readFileSync(new URL("../data/projects.json",import.meta.url),"utf8"));
const cv=JSON.parse(readFileSync(new URL("../data/cv.json",import.meta.url),"utf8"));

test("public engineering portfolio contains no sample project posing as completed work",()=>{
 assert.ok(projects.length>=1);
 assert.equal(new Set(projects.map(p=>p.slug)).size,projects.length);
 for(const p of projects){
   assert.ok(p.slug&&p.title&&p.summary);
   assert.doesNotMatch(JSON.stringify(p),/example structure for documenting/i);
   assert.doesNotMatch(JSON.stringify(p),/a component or assembly no longer performs as intended/i);
 }
 assert.ok(!projects.some(p=>p.slug==="repair-fixture"));
});

test("dive-computer project uses documented, appropriately scoped engineering results",()=>{
 const mount=projects.find(p=>p.slug==="equipment-mount-fixture");
 assert.ok(mount);
 assert.match(mount.title,/dive computer/i);
 assert.match(mount.summary,/drysuit compression/i);
 assert.ok(mount.process.some(x=>/support/i.test(x)));
 assert.ok(mount.results.some(x=>/11 minutes/.test(x)));
 assert.ok(mount.results.some(x=>/49 NOK/.test(x)));
 assert.ok(mount.materials.every(x=>x!== "PETG"),
   "Do not assert printer material before material is verified");
 assert.ok(cv.projects.some(x=>x.id==="dive-mount"));
});
