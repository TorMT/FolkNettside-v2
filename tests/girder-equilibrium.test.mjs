import test from "node:test";
import assert from "node:assert/strict";
import {auditGirderReactions,hermiteDeflectionExtrema} from "../src/structure/girder-equilibrium.js";
import {solveHullGirder} from "../src/structure/hull-girder.js";
import {boxMesh,wedgePrismMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {projectPressureToBeam} from "../src/structure/hydro-beam-transfer.js";
const G=9.80665;
const close=(actual,expected,tol=1e-7)=>assert.ok(
  Math.abs(actual-expected)<=Math.max(tol,Math.abs(expected)*1e-8),
  "expected "+actual+" ≈ "+expected);

test("equilibrium audit checks pitch independently, even when vertical forces balance",()=>{
 const correct=auditGirderReactions({
  externalForceN:-1000,externalMomentNm:-4000,referenceX:0,spanM:10,
  reactions:[{x:0,verticalN:600},{x:10,verticalN:400}]
 });
 assert.equal(correct.passed,true);
 close(correct.forceResidualN,0);
 close(correct.momentResidualNm,0);
 const wrong=auditGirderReactions({
  externalForceN:-1000,externalMomentNm:-4000,referenceX:0,spanM:10,
  reactions:[{x:0,verticalN:500},{x:10,verticalN:500}]
 });
 assert.equal(wrong.passed,false);
 close(wrong.forceResidualN,0);
 close(wrong.momentResidualNm,1000);
});

test("equilibrium audit is independent of the selected reference origin",()=>{
 const a=auditGirderReactions({
  externalForceN:-1000,externalMomentNm:-4000,referenceX:0,spanM:10,
  reactions:[{x:0,verticalN:600},{x:10,verticalN:400}]
 });
 const b=auditGirderReactions({
  externalForceN:-1000,externalMomentNm:-4000,referenceX:5,spanM:10,
  reactions:[{x:0,verticalN:600},{x:10,verticalN:400}]
 });
 assert.equal(a.passed,b.passed);
 close(a.momentResidualNm,b.momentResidualNm);
 assert.throws(()=>auditGirderReactions({externalForceN:0,externalMomentNm:0,
  reactions:[{x:NaN,verticalN:0}],spanM:2}),/invalid structural reaction/);
});

test("cubic Hermite deflection detects interior maximum with zero end deflections",()=>{
 // w(t)=a1 t+a2 t²+a3 t³ for equal positive end slopes.
 const points=hermiteDeflectionExtrema({
   x0:3,length:2,v1:0,theta1:1,v2:0,theta2:1
 });
 assert.ok(points.length>=3);
 assert.ok(points.some(p=>p.x>3&&p.x<5&&Math.abs(p.deflectionM)>.18));
 assert.ok(points.every(p=>p.x>=3&&p.x<=5));
 assert.throws(()=>hermiteDeflectionExtrema({
   x0:0,length:0,v1:0,theta1:0,v2:0,theta2:0
 }),/Invalid/);
});

test("coarse three-element beam reports exact interior deflection peak, not nearest node",()=>{
 const L=9,E=210e9,I=.08,massTonnes=30,segments=3;
 const q=massTonnes*1000*G/L;
 const beam=solveHullGirder({xMin:0,xMax:L,hullMassTonnes:massTonnes,
   hullCG:[L/2,0,0],E,I,extremeFiberM:1,segments});
 const exact=5*q*L**4/(384*E*I);
 // The cubic FEM interpolation is not the exact quartic continuum solution.
 // Its peak location is continuous within each element, and converges with mesh refinement.
 assert.ok(Math.abs(beam.maxDeflectionM-exact)/exact<.004);
 close(beam.peakDeflectionX,L/2,1e-8);
 assert.ok(beam.maxDeflectionM>Math.max(...beam.analysis.nodes.map(n=>Math.abs(n.uy))));
 assert.equal(beam.equilibriumAudit.passed,true);
 close(beam.equilibriumAudit.momentResidualNm,0,.005);
});

test("applied concentrated pitching couple passes independent moment audit",()=>{
 const model={unitScaleToMeters:1,components:[{
   id:"hull",name:"Wedge",geometry:wedgePrismMesh({L:8,B:2,H0:.5,H1:2}),
   metadata:{hydro:true}
 }]};
 const pressure=executeHydroRequest(model,"pressure",{
   waterline:1.2,densityKgM3:1000,sections:12
 });
 const transfer=projectPressureToBeam(pressure,{xMin:-4,xMax:4});
 const beam=solveHullGirder({xMin:-4,xMax:4,
  hullMassTonnes:15,hullCG:[0,0,.5],E:210e9,I:.08,extremeFiberM:1,
  buoyancyTransfer:transfer,supportModel:"pinned-roller",segments:12
 });
 assert.equal(beam.equilibriumAudit.passed,true);
 close(beam.equilibriumAudit.forceResidualN,0,.05);
 close(beam.equilibriumAudit.momentResidualNm,0,.1);
});
