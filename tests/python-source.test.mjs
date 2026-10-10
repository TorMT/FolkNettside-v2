import test from "node:test";
import assert from "node:assert/strict";
import {pythonSourceURL} from "../src/viewers/python-source.js";

const base="https://tormt.github.io/FolkNettside-v2/";
test("Python imports resolve for both URL-only and path-backed viewers",()=>{
 const expected="https://tormt.github.io/FolkNettside-v2/site-content/semesters/5/TMR4182/project/main.py";
 assert.equal(pythonSourceURL({url:"./site-content/semesters/5/TMR4182/project/main.py"},base),expected);
 assert.equal(pythonSourceURL({path:"./site-content/semesters/5/TMR4182/project/main.py"},base),expected);
 assert.equal(pythonSourceURL({url:expected},base),expected);
 assert.equal(pythonSourceURL({url:"/FolkNettside-v2/test.ipynb"},base),"https://tormt.github.io/FolkNettside-v2/test.ipynb");
});
test("No adjacent file fetch for synthetic source or different origins and protocols",()=>{
 assert.equal(pythonSourceURL({sourceText:"print('hello')",url:"/private.py"},base),"");
 assert.equal(pythonSourceURL({url:"https://evil.example/malware.py"},base),"");
 assert.equal(pythonSourceURL({url:"data:text/plain,x"},base),"");
 assert.equal(pythonSourceURL({url:"javascript:alert(1)"},base),"");
 assert.equal(pythonSourceURL({},base),"");
});
