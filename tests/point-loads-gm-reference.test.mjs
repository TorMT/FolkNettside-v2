import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {hydrostaticParticulars} from "../src/hydro/stability.js";
import {combinePointWeights,pointWeightsFromLines} from "../src/hydro/point-loads.js";
import {solveFrame2D} from "../src/structure/frame2d.js";

const near=(a,b,tolerance=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tolerance,
  `Expected ${a} = ${b} (±${tolerance})`);
function box(){
  return {name:"Analytical block",unitScaleToMeters:1,components:[{
    id:"hull",name:"Closed 10×4×3 box",geometry:boxMesh({L:10,B:4,H:3}),metadata:{hydro:true}
  }]};
}
test("transverse and longitudinal GM are independent for a non-square block",()=>{
  const r=executeHydroRequest(box(),"analyze",{waterline:1});
  const p=hydrostaticParticulars(r,{density:1025,kg:.5});
  near(p.volume,40);near(p.displacementTonnes,41);
  near(p.ixx,10*4**3/12);
  near(p.iyy,4*10**3/12);
  near(p.kb,.5);
  near(p.gmTransverse,4**2/(12*1));
  near(p.gmLongitudinal,10**2/(12*1));
  assert.ok(p.gmLongitudinal>p.gmTransverse*6,"Axes swapped");
});
test("point weight increases displacement and changes CG, GM in both axes at NEW draft",()=>{
  const base=executeHydroRequest(box(),"analyze",{waterline:1});
  const mass0=base.volume*1025/1000; // 41 t.
  const points=pointWeightsFromLines("1,2,1,2");
  const combined=combinePointWeights({
    baselineMassTonnes:mass0,baselineCG:[0,0,.5],pointWeights:points
  });
  near(combined.totalMassTonnes,42);
  near(combined.centerOfGravity[0],2/42);
  near(combined.centerOfGravity[1],1/42);
  near(combined.centerOfGravity[2],22.5/42);
  const targetV=42*1000/1025;
  const solved=executeHydroRequest(box(),"solve",{
    targetVolume:targetV,minWaterline:0,maxWaterline:3,tolerance:1e-8,maxIterations:80
  });
  const expectedT=42/41;
  near(solved.waterline,expectedT,1e-7);
  const loaded=executeHydroRequest(box(),"analyze",{waterline:solved.waterline});
  const p=hydrostaticParticulars(loaded,{kg:combined.centerOfGravity[2],density:1025});
  const KB=expectedT/2;
  near(p.gmTransverse,KB+4**2/(12*expectedT)-22.5/42,1e-7);
  near(p.gmLongitudinal,KB+10**2/(12*expectedT)-22.5/42,1e-7);
  assert.ok(p.gmTransverse>0&&p.gmLongitudinal>0);
  // A transverse and longitudinal mass moment shifts the equilibrium.
  const heel=executeHydroRequest(box(),"equilibrium",{axis:"heel",minAngle:-12,maxAngle:12,
    targetVolume:targetV,centerOfGravity:combined.centerOfGravity,leverTolerance:1e-6,maxIterations:80});
  const trim=executeHydroRequest(box(),"equilibrium",{axis:"trim",minAngle:-12,maxAngle:12,
    targetVolume:targetV,centerOfGravity:combined.centerOfGravity,leverTolerance:1e-6,maxIterations:80});
  near(heel.residual,0,1e-6);near(trim.residual,0,1e-6);
  assert.ok(Math.abs(heel.equilibriumAngle)>0.001);
  assert.ok(Math.abs(trim.equilibriumAngle)>0.001);
});
test("two point weights have independent x/y/z mass moments and negative removal",()=>{
  const combined=combinePointWeights({
    baselineMassTonnes:10,baselineCG:[0,0,1],
    pointWeights:pointWeightsFromLines("2,2,0,3\n3,0,-4,1\n-1,0,0,1")
  });
  near(combined.totalMassTonnes,14);
  near(combined.centerOfGravity[0],4/14);
  near(combined.centerOfGravity[1],-12/14);
  near(combined.centerOfGravity[2],(10+6+3-1)/14);
  assert.throws(()=>pointWeightsFromLines("1,4,2"),/line 1/);
  assert.throws(()=>combinePointWeights({baselineMassTonnes:2,baselineCG:[0,0,0],
    pointWeights:[{massTonnes:-3,x:0,y:0,z:0}]}),/positive/);
});
test("structural 2D point force at free end matches independent cantilever beam formulas",()=>{
  const E=210e9,I=8e-6,A=.02,L=3,F=-20000;
  const model={nodes:[{id:"fixed",x:0,y:0},{id:"tip",x:L,y:0}],
    elements:[{id:"beam",n1:"fixed",n2:"tip",E,I,A}],
    supports:[{node:"fixed",ux:true,uy:true,rz:true}],
    loads:[{node:"tip",fy:F,fx:0,mz:0}]};
  const solved=solveFrame2D(model);
  const fixed=solved.nodes[0],tip=solved.nodes[1];
  near(tip.uy,F*L**3/(3*E*I),1e-10);
  near(tip.rz,F*L**2/(2*E*I),1e-10);
  near(fixed.ry,-F,1e-7);
  near(Math.abs(fixed.rm),Math.abs(F*L),1e-5);
  // Axial point force, independent of transverse bending.
  model.loads[0].fx=12000;
  const axial=solveFrame2D(model);
  near(axial.nodes[1].ux,12000*L/(E*A),1e-10);
  near(axial.nodes[0].rx,-12000,1e-7);
});
