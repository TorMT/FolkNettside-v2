import test from "node:test";
import assert from "node:assert/strict";
import {
 previewCandidates,describeFusionPackagePaths
} from "../src/model/parsers/fusion-preview.js";
test("Fusion design thumbnails are original saved images, ranked large before small",()=>{
 const paths=["Robot/Previews/small.png","Robot/Previews/large.png",
   "Robot/Previews/medium.png","random/image.png","Robot/Geometry/mesh.stl"];
 assert.deepEqual(previewCandidates(paths),paths.slice(0,3).sort((a,b)=>
   ["large","medium","small"].indexOf(a.match(/(?:large|medium|small)/)?.[0])-
   ["large","medium","small"].indexOf(b.match(/(?:large|medium|small)/)?.[0])));
});
test("F3Z inventory keeps nested F3D designs and actual neutral fallback separate",()=>{
 const report=describeFusionPackagePaths([
   "designs/root.f3d","designs/pinion.f3d","model.step",
   "Previews/small.png","readme.json","models/gear.3mf"
 ]);
 assert.equal(report.entries,6);
 assert.deepEqual(report.designs,["designs/root.f3d","designs/pinion.f3d"]);
 assert.deepEqual(report.neutral,["model.step","models/gear.3mf"]);
 assert.deepEqual(report.previewCandidates,["Previews/small.png"]);
});
