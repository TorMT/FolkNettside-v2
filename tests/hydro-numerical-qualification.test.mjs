import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,wedgePrismMesh} from "../src/hydro/fixtures.js";
import {hydroCurve,analyzeModelDocument,solveWaterlineForVolume} from "../src/hydro/hydrostatics.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {initialStability,rectangularBargeStability} from "../src/hydro/stability.js";
import {gzCurve,gzAtHeel} from "../src/hydro/gz.js";
import {auditHydroCurve,auditSmallAngleGz,draftSolutionResidual} from "../src/hydro/numerical-audit.js";
import {hydroPanelHTML} from "../src/engineering/hydro-panel.js";

const near=(actual,expected,tol=1e-7)=>assert.ok(Math.abs(actual-expected)<tol,
  `Expected ${actual} ≈ ${expected}, tolerance ${tol}`);
const model=geometry=>({unitScaleToMeters:1,components:[
  {id:"external-hull",name:"Hull",geometry,metadata:{hydro:true}}
]});
test("rectangle V(T), dV/dT and hydrostatic inertia match independent analytic barge equations",()=>{
 const L=12,B=4,H=3,density=1025;
 const ship=model(boxMesh({L,B,H}));
 const rows=executeHydroRequest(ship,"curve",{minWaterline:0.25,maxWaterline:2.75,samples:11});
 const quality=auditHydroCurve(rows);
 assert.equal(quality.status,"pass",JSON.stringify(quality));
 assert.equal(quality.checkedIntervals,10);
 for(const row of rows){
   near(row.volume,L*B*row.waterline);
   near(row.waterplane.area,L*B);
   near(row.waterplane.ixx,L*B**3/12);
   near(row.waterplane.iyy,B*L**3/12);
   near(row.centerOfBuoyancy[2],row.waterline/2);
 }
 const upright=analyzeModelDocument(ship,1);
 const actual=initialStability(upright,{kg:.75});
 const reference=rectangularBargeStability({L,B,T:1,kg:.75});
 near(actual.gmTransverse,reference.gmTransverse);
 near(actual.gmLongitudinal,reference.gmLongitudinal);
 near(upright.volume*density/1000,L*B*1*density/1000);
});
test("wedge volume curve remains monotone and waterplane slope is consistent to finite-difference resolution",()=>{
 const ship=model(wedgePrismMesh({L:8,B:2,H0:.5,H1:2}));
 const rows=executeHydroRequest(ship,"curve",{minWaterline:.2,maxWaterline:1.75,samples:32});
 const audit=auditHydroCurve(rows,{derivativeRelativeTolerance:.16});
 assert.equal(audit.passed,true,JSON.stringify(audit));
 for(let i=1;i<rows.length;i++)assert.ok(rows[i].volume>=rows[i-1].volume-1e-7);
 assert.ok(rows.some(row=>row.waterplane.area>0));
});
test("numerical audit fails decreasing displacement and flags inconsistent dV/dT",()=>{
 const base=[{waterline:0,volume:0,waterplane:{area:10}},
             {waterline:1,volume:10,waterplane:{area:10}},
             {waterline:2,volume:8,waterplane:{area:10}}];
 const audit=auditHydroCurve(base);
 assert.equal(audit.passed,false);
 assert.equal(audit.status,"fail");
 assert.match(audit.errors.join("|"),/Displacement decreased/);
 const inconsistent=auditHydroCurve([
   {waterline:0,volume:0,waterplane:{area:10}},
   {waterline:1,volume:10,waterplane:{area:100}}
 ]);
 assert.equal(inconsistent.passed,true);
 assert.equal(inconsistent.status,"review");
 assert.ok(inconsistent.maxDerivativeRelativeError>0.7);
});
test("numerical audit rejects non-finite values and unordered draft samples",()=>{
 assert.equal(auditHydroCurve([{waterline:0,volume:0,waterplane:{area:0}}]).passed,false);
 assert.equal(auditHydroCurve([{waterline:0,volume:0,waterplane:{area:10}},
  {waterline:1,volume:NaN,waterplane:{area:10}}]).passed,false);
 assert.equal(auditHydroCurve([{waterline:1,volume:1,waterplane:{area:10}},
  {waterline:0,volume:0,waterplane:{area:10}}]).passed,false);
});
test("draft inverse solver certifies real volume residual instead of silently returning last iterate",()=>{
 const ship=model(boxMesh({L:10,B:4,H:3}));
 const targetVolume=33;
 const solved=executeHydroRequest(ship,"solve",{targetVolume,minWaterline:0,maxWaterline:3,
   tolerance:1e-9,maxIterations:80});
 near(solved.waterline,targetVolume/40,1e-8);
 const residual=draftSolutionResidual(solved,targetVolume,1e-9);
 assert.equal(residual.passed,true,JSON.stringify(residual));
 assert.equal(solved.converged,true);
 near(solved.result.volume,targetVolume,1e-9);
 assert.throws(()=>solveWaterlineForVolume(ship,targetVolume,{minWaterline:0,maxWaterline:3,
   tolerance:1e-15,maxIterations:1}),e=>e.code==="HYDRO_DRAFT_NOT_CONVERGED");
});
test("bad draft inputs and an unbracketed loading case explicitly throw",()=>{
 const ship=model(boxMesh({L:10,B:4,H:3}));
 assert.throws(()=>solveWaterlineForVolume(ship,50,{minWaterline:0,maxWaterline:3,
    tolerance:0}),/tolerance/);
 assert.throws(()=>solveWaterlineForVolume(ship,50,{minWaterline:0,maxWaterline:3,
    maxIterations:0}),/maxIterations/);
 assert.throws(()=>solveWaterlineForVolume(ship,130,{minWaterline:0,maxWaterline:3}),/outside the bracket/);
 assert.equal(draftSolutionResidual({waterline:1,result:{volume:10}},20,1e-7).passed,false);
});
test("GM inferred from small-angle GZ converges to independently calculated GM for a rectangular hull",()=>{
 const ship=model(boxMesh({L:10,B:4,H:3}));
 const hydro=executeHydroRequest(ship,"analyze",{waterline:1});
 const kg=.5,gm=initialStability(hydro,{kg}).gmTransverse;
 const positive=gzAtHeel(ship,{heelDeg:.5,targetVolume:hydro.volume,kg});
 const negative=gzAtHeel(ship,{heelDeg:-.5,targetVolume:hydro.volume,kg});
 near(positive.gz,-negative.gz,1e-5);
 const check=auditSmallAngleGz([negative,positive],gm,{maxAngleDeg:1});
 assert.equal(check.status,"pass",JSON.stringify(check));
 near(check.estimatedGm,gm,.01);
 const bad=auditSmallAngleGz([positive],gm*4);
 assert.equal(bad.status,"review");
 const noAngle=auditSmallAngleGz(gzCurve(ship,{targetVolume:hydro.volume,kg,minHeel:10,maxHeel:30,step:10}),gm);
 assert.equal(noAngle.status,"unavailable");
});

test("sloped wedge matches independent closed-form V(T) and A(T), including exact chine draft",()=>{
 const L=8,B=2,H0=.5,H1=2,dh=H1-H0;
 const ship=model(wedgePrismMesh({L,B,H0,H1}));
 for(const T of [.25,.5,.7,1,1.5,1.9]){
   const row=executeHydroRequest(ship,"analyze",{waterline:T});
   const expectedVolume=B*L*(T<=H0?T:T-(T-H0)**2/(2*dh));
   const expectedArea=B*L*(T<=H0?1:1-(T-H0)/dh);
   near(row.volume,expectedVolume,1e-7);
   near(row.waterplane.area,expectedArea,1e-7);
 }
});

test("Hydro UI shows GM/GZ only for same displacement and symmetric transverse loading",()=>{
 const ship={...model(boxMesh({L:10,B:4,H:3})),name:"Reference hull"};
 const result=executeHydroRequest(ship,"analyze",{waterline:1});
 const curve=executeHydroRequest(ship,"curve",{minWaterline:.25,maxWaterline:1.75,samples:7});
 const gz=gzCurve(ship,{targetVolume:result.volume,kg:.5,minHeel:0,maxHeel:5,step:5});
 const options={modelDocument:ship,result,curve,draft:1,kg:.5,gz,
    tcg:0,config:{density:1025,minDraft:0,maxDraft:3}};
 const ui=hydroPanelHTML(options);
 assert.equal(ui.qualityAudit.status,"pass");
 assert.equal(ui.gmCrossCheck.status,"pass",JSON.stringify(ui.gmCrossCheck));
 assert.match(ui.results,/Numerical consistency/);
 assert.match(ui.results,/Small-angle GZ\/GM/);
 const mismatch=hydroPanelHTML({...options,result:executeHydroRequest(ship,"analyze",{waterline:1.5})});
 assert.equal(mismatch.gmCrossCheck,null);
 const offsetCG=hydroPanelHTML({...options,tcg:1});
 assert.equal(offsetCG.gmCrossCheck,null);
 const longitudinalOffset=hydroPanelHTML({...options,lcg:1});
 assert.equal(longitudinalOffset.gmCrossCheck,null);
});
