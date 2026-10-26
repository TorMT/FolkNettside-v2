import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {addPitchDriveCourseModel,PITCH_DRIVE_MODEL_PATH,PITCH_DRIVE_COURSE} from "../src/courses/pitch-drive-course-model.js";
import {renderResourceTree} from "../src/components/resource-tree.js";
import {viewerKind} from "../src/viewers/registry.js";

test("one curated local pitch-drive model augments the right public course only",()=>{
 const before={semesters:[
   {id:4,courses:[{code:PITCH_DRIVE_COURSE,resources:[]}]},
   {id:5,courses:[
     {code:PITCH_DRIVE_COURSE,sections:["Filer og ressurser"],
       resources:[{name:"lecture.pdf",path:"https://tormt.folk.ntnu.no/test.pdf",source:"ntnu"}]},
     {code:"other-course",sections:[],resources:[]}
   ]}
 ]};
 const out=addPitchDriveCourseModel(before);
 const course=out.semesters[1].courses[0];
 assert.equal(out.semesters[0].courses[0].resources.length,0);
 assert.equal(out.semesters[1].courses[1].resources.length,0);
 assert.equal(before.semesters[1].courses[0].resources.length,1);
 assert.equal(course.resources.length,2);
 assert.ok(course.sections.includes("Modeller"));
 assert.equal(course.resources[0].name,"lecture.pdf");
 const model=course.resources[1];
 assert.equal(model.label,"Full modell");
 assert.equal(model.kind,"HTML");
 assert.equal(model.source,"site");
 assert.equal(model.remoteArchive,undefined);
 assert.equal(model.path,PITCH_DRIVE_MODEL_PATH);
 assert.equal(viewerKind(model),"html");
 assert.equal(addPitchDriveCourseModel(out).semesters[1].courses[0].resources.length,2);
 const html=renderResourceTree(course.resources,item=>course.resources.indexOf(item),{
   routeForResource:index=>"#/viewer/5/"+PITCH_DRIVE_COURSE+"/"+index
 });
 assert.match(html,/Full modell/);
 assert.ok(html.includes("#/viewer/5/"+PITCH_DRIVE_COURSE+"/1"));
});

test("the published pitch drive HTML source is complete and locally hosted",()=>{
 const relative=PITCH_DRIVE_MODEL_PATH.slice(2);
 assert.ok(existsSync(new URL("../"+relative,import.meta.url)));
 const html=readFileSync(new URL("../"+relative,import.meta.url),"utf8");
 assert.match(html,/<!DOCTYPE html>/);
 assert.match(html,/OrbitControls/);
 assert.match(html,/Planetgirdrift, 3 trinn og ringgir/);
 assert.match(html,/Pinjong og ring/);
 assert.ok(html.length>10000);
});
