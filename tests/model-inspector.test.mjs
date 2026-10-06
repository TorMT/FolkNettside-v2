import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {attitudeMatrix,modelFileKind,modelHydroSummary,modelHydroSummaryAtAttitude,transformedModelDocument} from "../src/tools/model-inspector-core.js";

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

test("attitude transform preserves full solid volume",()=>{
  const model={unitScaleToMeters:1,components:[{id:"box",name:"Box",geometry:boxMesh({L:4,B:2,H:2}),metadata:{}}]};
  const base=modelHydroSummary(model,10,1000);
  const rotated=modelHydroSummaryAtAttitude(model,10,1000,{heel:90,trim:0,yaw:0});
  assert.ok(Math.abs(base.solidVolume-rotated.solidVolume)<1e-7);
});

test("attitude transform changes world centroid consistently",()=>{
  const model={unitScaleToMeters:1,components:[{id:"box",name:"Box",geometry:boxMesh({L:2,B:2,H:2}),metadata:{}}]};
  const transformed=transformedModelDocument(model,{heel:90});
  const result=modelHydroSummary(transformed,10,1000);
  assert.ok(Math.abs(result.solidCentroid[0]-0)<1e-7);
  assert.ok(Math.abs(result.solidCentroid[1]+1)<1e-7);
  assert.ok(Math.abs(result.solidCentroid[2]-1)<1e-7);
});

test("attitude matrix returns identity at zero angles",()=>{
  assert.deepEqual(attitudeMatrix({heel:0,trim:0,yaw:0}),[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
});
