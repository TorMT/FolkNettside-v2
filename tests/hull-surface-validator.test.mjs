import test from "node:test";
import assert from "node:assert/strict";
import {validateHullSurface} from "../src/model/hull-surface-validator.js";

const tetra=()=>({
  positions:[0,0,0, 1,0,0, 0,1,0, 0,0,1],
  indices:[0,2,1, 0,1,3, 0,3,2, 1,2,3]
});
test("closed outward tetra passes geometry preflight but still needs review",()=>{
  const result=validateHullSurface(tetra(),{expectedSize:[1,1,1]});
  assert.equal(result.passed,true,JSON.stringify(result.errors));
  assert.equal(result.reviewRequired,true);
  assert.ok(Math.abs(result.metrics.signedVolume-1/6)<1e-12);
});
test("open surface is blocked",()=>{
  const mesh=tetra();mesh.indices.splice(9,3);
  const result=validateHullSurface(mesh);
  assert.equal(result.passed,false);
  assert.ok(result.metrics.boundaryEdges>0);
});
test("inside-out surface is blocked",()=>{
  const mesh=tetra();
  for(let i=0;i<mesh.indices.length;i+=3)[mesh.indices[i+1],mesh.indices[i+2]]=[mesh.indices[i+2],mesh.indices[i+1]];
  assert.match(validateHullSurface(mesh).errors.join(";"),/volume/);
});
test("a flipped face is blocked by edge winding",()=>{
  const mesh=tetra();[mesh.indices[1],mesh.indices[2]]=[mesh.indices[2],mesh.indices[1]];
  assert.ok(validateHullSurface(mesh).metrics.orientationConflicts>0);
});
test("nonfinite vertices and out of range indices fail safely",()=>{
  const mesh=tetra();mesh.positions[0]=NaN;
  assert.equal(validateHullSurface(mesh).passed,false);
  const mesh2=tetra();mesh2.indices[0]=99;
  assert.equal(validateHullSurface(mesh2).passed,false);
});
test("dimensions are checked without silently rescaling",()=>{
  assert.equal(validateHullSurface(tetra(),{expectedSize:[36,9,5]}).passed,false);
});
