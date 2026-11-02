import test from "node:test";
import assert from "node:assert/strict";
import {estimateSmallAngleRollPeriod} from "../src/hydro/roll-period.js";
import {combineHullLoading} from "../src/hydro/hull-loading.js";
const near=(value,expected,tol=1e-10)=>assert.ok(
  Math.abs(value-expected)<=tol,`Expected ${value} ≈ ${expected}`
);

test("baseline small-angle roll period matches rigid-body analytical result",()=>{
  const result=estimateSmallAngleRollPeriod({gmTransverse:.5,hullRollRadiusM:1,
    baselineMassTonnes:10,baselineCG:[0,0,0]});
  near(result.rollInertiaTonnesM2,10);
  near(result.effectiveRollRadiusM,1);
  near(result.periodSeconds,2*Math.PI/Math.sqrt(9.80665*.5));
});

test("off-centre added mass changes CG and actual roll inertia, not only GM",()=>{
  const load=combineHullLoading({hullMassTonnes:10,hullCG:[0,0,0],
    pointWeights:[{massTonnes:2,x:100,y:3,z:0}]});
  const result=estimateSmallAngleRollPeriod({gmTransverse:.5,hullRollRadiusM:1,loading:load});
  near(load.centerOfGravity[1],.5);
  near(result.rollInertiaTonnesM2,25); // 10 + 10*0.5² + 2*2.5²
  near(result.effectiveRollRadiusM,Math.sqrt(25/12));
  near(result.periodSeconds,2*Math.PI*Math.sqrt(25/(12*9.80665*.5)));
});

test("deck area load integrates exact transverse inertia width²/12",()=>{
  const load=combineHullLoading({hullMassTonnes:10,hullCG:[0,0,0],
    areaLoads:[{densityTonnesPerM2:1,x0:0,x1:2,y0:-1,y1:1,z:0}]});
  const result=estimateSmallAngleRollPeriod({gmTransverse:.5,hullRollRadiusM:1,loading:load});
  near(result.rollInertiaTonnesM2,10+4/3);
  near(result.massTonnes,14);
});

test("non-positive GM is flagged as unstable, never shown as an oscillation period",()=>{
  for(const gm of [0,-.2]){
    const r=estimateSmallAngleRollPeriod({gmTransverse:gm,hullRollRadiusM:1,
      baselineMassTonnes:10,baselineCG:[0,0,0]});
    assert.equal(r.stable,false);assert.equal(r.periodSeconds,null);
  }
});

test("missing radius and physically inconsistent removed inertia are rejected",()=>{
  assert.throws(()=>estimateSmallAngleRollPeriod({gmTransverse:.5,
    baselineMassTonnes:10,baselineCG:[0,0,0],hullRollRadiusM:""}),/required/);
  const removal=combineHullLoading({hullMassTonnes:10,hullCG:[0,0,0],
    pointWeights:[{massTonnes:-9,x:0,y:10,z:0}]});
  assert.throws(()=>estimateSmallAngleRollPeriod({gmTransverse:.5,
    hullRollRadiusM:.1,loading:removal}),/non-positive/);
});

test("nonzero CG elevation and removed mass use transverse YZ parallel-axis inertia",()=>{
  const load=combineHullLoading({hullMassTonnes:10,hullCG:[0,0,1],
    pointWeights:[{massTonnes:-1,x:0,y:0,z:3},{massTonnes:2,x:0,y:2,z:1}]});
  const result=estimateSmallAngleRollPeriod({gmTransverse:.5,hullRollRadiusM:1,loading:load});
  const cy=load.centerOfGravity[1],cz=load.centerOfGravity[2];
  const expected=10*(1+cy**2+(1-cz)**2)-1*(cy**2+(3-cz)**2)
    +2*((2-cy)**2+(1-cz)**2);
  near(result.rollInertiaTonnesM2,expected);
});

test("Hydro inspector exposes period and uses recalculated loaded GM, never stale reference GM",async()=>{
  const {boxMesh}=await import("../src/hydro/fixtures.js");
  const {executeHydroRequest}=await import("../src/hydro/hydro-service.js");
  const {hydrostaticParticulars}=await import("../src/hydro/stability.js");
  const {hydroPanelHTML}=await import("../src/engineering/hydro-panel.js");
  const hull={name:"10 x 4 m box",unitScaleToMeters:1,components:[{
    id:"hull",name:"Hull",geometry:boxMesh({L:10,B:4,H:3}),metadata:{hydro:true}
  }]};
  const initial=executeHydroRequest(hull,"analyze",{waterline:1});
  const curve=executeHydroRequest(hull,"curve",{minWaterline:.5,maxWaterline:2,samples:9});
  const reference=hydroPanelHTML({modelDocument:hull,result:initial,curve,
    draft:1,kg:.5,rollRadiusM:"1",config:{minDraft:0,maxDraft:3,density:1025}});
  assert.match(reference.inspector,/id="hydro-roll-radius"/);
  near(reference.rollPeriod.massTonnes,41);
  assert.match(reference.inspector,/Reference small-angle period/);

  const loading=combineHullLoading({hullMassTonnes:41,hullCG:[0,0,.5],
    pointWeights:[{massTonnes:1,x:0,y:1,z:2}]});
  const newDraft=executeHydroRequest(hull,"solve",{targetVolume:42*1000/1025,
    minWaterline:0,maxWaterline:3,tolerance:1e-8,maxIterations:80}).waterline;
  const hydro=executeHydroRequest(hull,"analyze",{waterline:newDraft});
  const loadedGM=hydrostaticParticulars(hydro,{kg:loading.centerOfGravity[2],density:1025});
  const loaded=hydroPanelHTML({modelDocument:hull,result:initial,curve,
    draft:1,kg:loading.centerOfGravity[2],pointWeightSummary:loading,
    loadedGM,rollRadiusM:"1",config:{minDraft:0,maxDraft:3,density:1025}});
  near(loaded.rollPeriod.massTonnes,42);
  near(loaded.rollPeriod.gmTransverse,loadedGM.gmTransverse);
  assert.match(loaded.inspector,/Loaded small-angle period/);

  const unsolved=hydroPanelHTML({modelDocument:hull,result:initial,curve,
    draft:1,kg:loading.centerOfGravity[2],pointWeightSummary:loading,
    rollRadiusM:"1",config:{minDraft:0,maxDraft:3,density:1025}});
  assert.equal(unsolved.rollPeriod,null);
  assert.match(unsolved.inspector,/Loaded GM must be solved/);
});
