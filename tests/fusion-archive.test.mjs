import test from "node:test";
import assert from "node:assert/strict";
import {
  FusionConversionRequiredError,
  fusionArchiveInventory,
  nativeFusionPlaceholder,
  selectFusionArchiveCandidate
} from "../src/model/parsers/fusion-archive.js";

test("Fusion archive prefers 3MF before STL and sorts deterministically",()=>{
  const paths=["z/model.stl","b/model.3mf","a/model.3mf","readme.txt"];
  assert.equal(selectFusionArchiveCandidate(paths),"a/model.3mf");
});

test("Fusion archive falls back to STL",()=>{
  assert.equal(selectFusionArchiveCandidate(["meta.json","Meshes/hull.stl"]),"Meshes/hull.stl");
});

test("Fusion inventory exposes supported fallback counts",()=>{
  assert.deepEqual(fusionArchiveInventory([
    "a.3mf","b.stl","nested/c.stl","design.f3d","notes.txt"
  ]),{
    entries:5,
    threeMF:1,
    stl:2,
    nativeFusion:1,
    candidate:"a.3mf"
  });
});

test("native F3D explicitly requests APS instead of guessing",()=>{
  assert.throws(
    ()=>nativeFusionPlaceholder({name:"assembly",format:"F3D"}),
    error=>error instanceof FusionConversionRequiredError&&error.code==="APS_REQUIRED"
  );
});
