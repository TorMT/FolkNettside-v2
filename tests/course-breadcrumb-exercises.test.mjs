import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseNTNUSemesterIndex} from "../src/courses/ntnu-catalog.js";
import {viewerBreadcrumbHTML} from "../src/viewers/viewer-breadcrumb.js";

test("flat exercise PDF and solution files become exercise sections without changing original paths",()=>{
  const result=parseNTNUSemesterIndex(5,{
    "Marin-Dynamikk":{dir:"Marin-Dynamikk",files:[
      "filer/Øving7.pdf",
      "filer/Øving7 løsning.pdf",
      "filer/Øving3/oppgave.py",
      "filer/notater.pdf",
      "filer/Andre/Øving8.pdf",
      "filer/Andre/les-meg.txt",
      "filer/Øving12a.pdf"
    ]}
  });
  const course=result.courses[0];
  const section=name=>course.resources.find(r=>r.name===name)?.section;
  assert.equal(section("Øving7.pdf"),"Øving 7");
  assert.equal(section("Øving7 løsning.pdf"),"Øving 7");
  assert.equal(section("oppgave.py"),"Øving3");
  assert.equal(section("Øving8.pdf"),"Øving 8");
  assert.equal(section("les-meg.txt"),"Andre");
  assert.equal(section("Øving12a.pdf"),"Filer og ressurser");
  assert.equal(course.resources.find(r=>r.name==="Øving7.pdf").relativePath,"filer/Øving7.pdf");
  assert.ok(course.sections.includes("Øving 7"));
});

test("viewer breadcrumbs navigate to courses, semester, course and section",()=>{
  const html=viewerBreadcrumbHTML({
    semester:5,courseCode:"Marin-Dynamikk",courseTitle:"Marin dynamikk",
    section:"Øving 7",sectionIndex:2
  });
  assert.match(html,/href="#\/courses"/);
  assert.match(html,/href="#\/courses\/5"/);
  assert.match(html,/href="#\/courses\/5\/Marin-Dynamikk"/);
  assert.match(html,/href="#\/courses\/5\/Marin-Dynamikk\/section\/2"/);
  assert.match(html,/Marin dynamikk/);
  assert.match(html,/Øving 7/);
});

test("breadcrumb values are safely escaped and invalid codes never become links",()=>{
  const html=viewerBreadcrumbHTML({semester:5,courseCode:"Bad/Path",section:'<img src=x onerror=1>'});
  assert.doesNotMatch(html,/href="#\/courses\/5\/Bad/);
  assert.doesNotMatch(html,/<img/);
  assert.doesNotMatch(html,/onerror/);
});

test("course router accepts section deep links and viewer injects validated breadcrumb context",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const viewer=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
  assert.match(app,/sectionIndex:m\[3\]===undefined\?null:Number\(m\[3\]\)/);
  assert.match(app,/courseTitle:course\.title,sectionIndex:course\.sections\.indexOf\(resource\.section\)/);
  assert.match(app,/if\(course\)return coursePage\(course\.semester,course\.code,course\.sectionIndex\)/);
  assert.match(viewer,/viewerBreadcrumbHTML\(resource\)/);
});
