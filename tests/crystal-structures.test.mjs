import test from "node:test";
import assert from "node:assert/strict";
import {cellEdges,crystalType,listCrystalTypes,scaledPoints} from "../src/tools/crystal-structures-core.js";

test("core crystal structures expose expected conventional-cell metadata",()=>{
  assert.equal(crystalType("bcc").equivalentAtoms,2);
  assert.equal(crystalType("bcc").coordinationNumber,8);
  assert.equal(crystalType("fcc").equivalentAtoms,4);
  assert.equal(crystalType("fcc").coordinationNumber,12);
  assert.equal(crystalType("hcp").coordinationNumber,12);
  assert.equal(listCrystalTypes().length,3);
});

test("cubic cells expose twelve box edges",()=>{
  assert.equal(cellEdges("bcc").length,12);
  assert.equal(cellEdges("fcc").length,12);
});

test("hcp uses ideal c over a when c is omitted",()=>{
  const points=scaledPoints("hcp",{a:2});
  const maxZ=Math.max(...points.map(p=>p[2]));
  assert.ok(Math.abs(maxZ-2*Math.sqrt(8/3))<1e-7);
});

test("explicit hcp c overrides ideal ratio",()=>{
  const points=scaledPoints("hcp",{a:2,c:5});
  assert.equal(Math.max(...points.map(p=>p[2])),5);
});
