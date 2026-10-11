import test from "node:test";
import assert from "node:assert/strict";
import {pythonUploadPaths} from "../src/viewers/python-folder-paths.js";

const file=(path)=>({name:path.split("/").at(-1),webkitRelativePath:path});
test("directory upload removes the picker wrapper, preserving nested Python packages",()=>{
 const input=[
   file("project/main.py"),file("project/samplelib/__init__.py"),
   file("project/samplelib/geometry/loads.py"),file("project/data/measurements.csv")
 ];
 assert.deepEqual(pythonUploadPaths(input,{folder:true}).map(x=>x.name),[
   "main.py","samplelib/__init__.py","samplelib/geometry/loads.py","data/measurements.csv"
 ]);
});
test("single-file uploads do not strip legitimate path segments",()=>{
 const files=[file("root/main.py"),file("root/data/measurements.csv")];
 assert.deepEqual(pythonUploadPaths(files).map(x=>x.name),["main.py","measurements.csv"]);
});
test("unsafe or mixed folder selections fail before any file is uploaded",()=>{
 for(const list of [
   [file("root/main.py"),file("another/lib.py")],
   [file("root/../secret.py")],
   [{name:"script.py",webkitRelativePath:"script.py"}],
   [file("root//invalid.py")]
 ])assert.throws(()=>pythonUploadPaths(list,{folder:true}),/folder|Folder/i);
 assert.deepEqual(pythonUploadPaths([],{folder:true}),[]);
});
