import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseNTNUSemesterIndex} from "../src/courses/ntnu-catalog.js";
import {viewerBreadcrumbHTML} from "../src/viewers/viewer-breadcrumb.js";

test("flat exercise PDF and solution files become exercise sections without changing original paths",()=>{
  const result=parseNTNUSemesterIndex(5,{
    "Marin-Dynamikk":{dir:"Marin-Dynamikk",beskyttet:false,files:[
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

test("loose letter-numbered propulsion exercise files become exercise sections in V2",()=>{
  // These are actual public catalog filename shapes; no NTNU file bytes.
  const names=[
    "filer/ØvingH1.pdf",
    "filer/ØvingM1.pdf",
    "filer/ØvingM2.pdf",
    "filer/ØvingR1.xlsx",
    "filer/ØvingR3.pdf",
    "filer/ØvingH2/ØvingH2.pdf",
    "filer/ØvingR2/ØvingR2.pdf",
    "filer/Øving12a.pdf",
    "filer/Øving2Full.pdf",
    "filer/Øving R 04 løsning.pdf",
    "filer/Oving_05.pdf",
    "filer/notater.pdf"
  ];
  const parsed=parseNTNUSemesterIndex(5,{
    "marin-teknikk-4-propulsjon":{
      dir:"marin-teknikk-4-propulsjon",beskyttet:false,files:names
    }
  });
  const course=parsed.courses[0];
  const section=path=>course.resources.find(r=>r.relativePath===path)?.section;
  assert.equal(section("filer/ØvingH1.pdf"),"Øving H1");
  assert.equal(section("filer/ØvingM1.pdf"),"Øving M1");
  assert.equal(section("filer/ØvingM2.pdf"),"Øving M2");
  assert.equal(section("filer/ØvingR1.xlsx"),"Øving R1");
  assert.equal(section("filer/ØvingR3.pdf"),"Øving R3");
  assert.equal(section("filer/Øving R 04 løsning.pdf"),"Øving R4");
  assert.equal(section("filer/Oving_05.pdf"),"Øving 5");
  assert.equal(section("filer/ØvingH2/ØvingH2.pdf"),"ØvingH2",
    "An existing exercise directory must retain its section");
  assert.equal(section("filer/ØvingR2/ØvingR2.pdf"),"ØvingR2");
  assert.equal(section("filer/Øving12a.pdf"),"Filer og ressurser");
  assert.equal(section("filer/Øving2Full.pdf"),"Filer og ressurser");
  assert.equal(section("filer/notater.pdf"),"Filer og ressurser");
  const original=course.resources.find(r=>r.name==="ØvingR1.xlsx");
  assert.equal(original.kind,"XLSX");
  assert.equal(original.relativePath,"filer/ØvingR1.xlsx");
  assert.equal(original.path,
    "/semestre/5/marin-teknikk-4-propulsjon/filer/%C3%98vingR1.xlsx");
  assert.ok(course.sections.includes("Øving R1"));
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
