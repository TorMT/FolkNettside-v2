import test from "node:test";
import assert from "node:assert/strict";
import {onGithubPagesArchive,asRemoteNTNUManifest} from "../src/content.js";
import {quizStorageKey} from "../src/viewers/quiz-core.js";
import {NTNU_ORIGIN} from "../src/courses/ntnu-catalog.js";

const sourceResource={
 source:"ntnu",semester:5,
 relativePath:"filer/Øving3/solver.py",kind:"PY",
 path:"/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/solver.py",
 url:NTNU_ORIGIN+"/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/solver.py"
};

test("only the exact project Pages host and prefix are eligible for remote archive",()=>{
 assert.equal(onGithubPagesArchive("tormt.github.io","/FolkNettside-v2/"),true);
 assert.equal(onGithubPagesArchive("tormt.github.io","/FolkNettside-v2/index.html"),true);
 for(const [host,path] of [
  ["evil.tormt.github.io","/FolkNettside-v2/"],
  ["tormt.github.io.evil.example","/FolkNettside-v2/"],
  ["tormt.github.io","/FolkNettside-v2-malware/"],
  ["tormt.folk.ntnu.no","/FolkNettside-v2/"],
  ["localhost","/FolkNettside-v2/"]
 ])assert.equal(onGithubPagesArchive(host,path),false);
});

test("Pages course resources use original NTNU absolute URLs, never GitHub /semestre URLs",()=>{
 const source={
  schemaVersion:2,source:"ntnu-auto-validated",
  semesters:[{id:5,label:"Semester 5",courses:[{
   code:"Marin-Dynamikk",title:"Marin dynamikk",
   resources:[sourceResource]
  }]}]
 };
 const converted=asRemoteNTNUManifest(source);
 const resource=converted.semesters[0].courses[0].resources[0];
 assert.equal(resource.originalPath,sourceResource.path);
 assert.equal(resource.path,sourceResource.url);
 assert.equal(resource.url,sourceResource.url);
 assert.equal(resource.remoteArchive,true);
 assert.equal(quizStorageKey(resource),quizStorageKey(sourceResource));
 assert.equal(source.semesters[0].courses[0].resources[0].path,sourceResource.path);
 assert.equal(converted.source,"ntnu-github-pages-references");
});
