import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../src/app.js",import.meta.url),"utf8");

for(const name of [
  "portfolioPage",
  "projectPage",
  "coursesPage",
  "coursePage",
  "settingsPage",
  "engineeringPage",
  "viewerPage"
]){
  test(`app defines ${name}`,()=>{
    assert.match(source,new RegExp(`function\\s+${name}\\s*\\(`));
  });
}

test("app keeps Courses routes and legacy Study alias",()=>{
  assert.match(source,/\/courses/);
  assert.match(source,/\/study/);
});

test("app includes physical project route",()=>{
  assert.match(source,/\/projects\//);
});
