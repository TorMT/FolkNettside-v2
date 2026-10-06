import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {modelFileKind,modelHydroSummary} from "../src/tools/model-inspector-core.js";

test("model inspector accepts STL and 3MF only",()=>{
  assert.equal(modelFileKind("boat.stl"),"STL");
  assert.equal(modelFileKind("assembly.3MF"),"3MF");
  assert.equal(modelFileKind("drawing.obj"),null);
});

test("model inspector hydro and solid centroid reuse tested hydro core",()=>{
  const model={unitScaleToMeters:1,components:[{id:"box",name:"Box",geometry:boxMesh({L:10,B:4,H:2}),metadata:{}}]};
  const result=modelHydroSummary(model,1,1000);
  assert.ok(Math.abs(result.volume-40)<1e-7);
  assert.ok(Math.abs(result.displacementKg-40000)<1e-4);
  assert.ok(Math.abs(result.centerOfBuoyancy[2]-.5)<1e-7);
  assert.ok(Math.abs(result.solidVolume-80)<1e-7);
  assert.ok(Math.abs(result.solidCentroid[2]-1)<1e-7);
  assert.equal(result.diagnostics.watertight,true);
});