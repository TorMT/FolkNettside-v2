import test from "node:test";
import assert from "node:assert/strict";
import {buildSearchIndex,searchIndex} from "../src/search/search-index.js";

const fixture=buildSearchIndex({
  projects:[{
    slug:"mount-project",
    title:"Equipment mount",
    type:"physical",
    summary:"Parametric bracket",
    skills:["CAD","printing"],
    tools:["Fusion"]
  }],
  semesters:[{
    id:5,
    label:"Semester 5",
    courses:[{
      code:"TMR4182",
      title:"Marine construction",
      description:"Hull and FEM",
      tags:["FEM"],
      resources:[
        {
          label:"Exercise 01 solve",
          name:"solve.py",
          kind:"PY",
          section:"Exercises",
          folders:["Exercise 01"],
          relativePath:"Exercises/Exercise 01/solve.py"
        },
        {
          label:"Hydro notes",
          name:"hydro.pdf",
          kind:"PDF",
          section:"Notes",
          folders:[],
          relativePath:"Notes/hydro.pdf"
        }
      ]
    }]
  }]
});

test("search indexes all entity types",()=>{
  assert.equal(fixture.length,4);
  assert.equal(searchIndex(fixture,"TMR4182")[0].type,"course");
  assert.equal(searchIndex(fixture,"solve")[0].route,"/viewer/5/TMR4182/0");
  assert.equal(searchIndex(fixture,"printing")[0].route,"/projects/mount-project");
});

test("folder names are searchable",()=>{
  const result=searchIndex(fixture,"Exercise 01");
  assert.equal(result.length,1);
  assert.equal(result[0].title,"Exercise 01 solve");
});

test("all query tokens are required",()=>{
  assert.equal(searchIndex(fixture,"hydro pdf").length,1);
  assert.equal(searchIndex(fixture,"hydro fem").length,0);
});
