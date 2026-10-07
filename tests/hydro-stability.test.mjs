import test from "node:test";
import assert from "node:assert/strict";
import {analyzeHydrostatics} from "../src/hydro/hydrostatics.js";
import {boxMesh} from "../src/hydro/fixtures.js";
import {initialStability,rectangularBargeStability} from "../src/hydro/stability.js";

const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

test("rectangular barge BM matches closed-form expressions",()=>{
  const L=10,B=3,T=1.2;
  const hydro=analyzeHydrostatics(boxMesh({L,B,H:2}),T);
  const numeric=initialStability(hydro);
  const exact=rectangularBargeStability({L,B,T});
  near(numeric.kb,exact.kb);
  near(numeric.bmTransverse,exact.bmTransverse,1e-8);
  near(numeric.bmLongitudinal,exact.bmLongitudinal,1e-8);
  near(numeric.kmTransverse,exact.kmTransverse,1e-8);
  near(numeric.kmLongitudinal,exact.kmLongitudinal,1e-8);
});

test("GM subtracts supplied KG from KM",()=>{
  const L=12,B=4,T=2,kg=1.1;
  const hydro=analyzeHydrostatics(boxMesh({L,B,H:3}),T);
  const result=initialStability(hydro,{kg});
  const exact=rectangularBargeStability({L,B,T,kg});
  near(result.gmTransverse,exact.gmTransverse,1e-8);
  near(result.gmLongitudinal,exact.gmLongitudinal,1e-8);
});

test("KG is optional and zero displacement is rejected",()=>{
  const result=initialStability({volume:0,centerOfBuoyancy:[0,0,0],waterplane:{}});
  assert.equal(result.valid,false);
  const hydro=analyzeHydrostatics(boxMesh({L:2,B:2,H:2}),1);
  assert.equal(initialStability(hydro).gmTransverse,null);
});
