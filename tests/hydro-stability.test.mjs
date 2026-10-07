import test from "node:test";
import assert from "node:assert/strict";
import {analyzeHydrostatics} from "../src/hydro/hydrostatics.js";
import {boxMesh} from "../src/hydro/fixtures.js";
import {hydrostaticCurveRows,hydrostaticParticulars,initialStability,rectangularBargeStability} from "../src/hydro/stability.js";

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


test("hydrostatic particulars expose LCF, TCF and tonnes per centimetre",()=>{
  const L=10,B=4,T=1.5,density=1025;
  const hydro=analyzeHydrostatics(boxMesh({L,B,H:3}),T);
  const p=hydrostaticParticulars(hydro,{density,kg:1});
  near(p.waterplaneArea,L*B,1e-8);
  near(p.lcf,0,1e-8);
  near(p.tcf,0,1e-8);
  near(p.tonnesPerCm,density*L*B*.01/1000,1e-8);
  near(p.displacementTonnes,L*B*T*density/1000,1e-8);
  near(p.kb,T/2,1e-8);
});

test("hydrostatic curve rows retain draft and derive stability at each sample",()=>{
  const samples=[1,1.5,2].map(draft=>({
    waterline:draft,
    ...analyzeHydrostatics(boxMesh({L:12,B:4,H:3}),draft)
  }));
  const rows=hydrostaticCurveRows(samples,{density:1000,kg:1});
  assert.equal(rows.length,3);
  near(rows[1].draft,1.5);
  near(rows[1].displacementTonnes,72);
  near(rows[1].tonnesPerCm,.48);
  assert.ok(Number.isFinite(rows[1].kmTransverse));
  assert.ok(Number.isFinite(rows[1].gmTransverse));
});
