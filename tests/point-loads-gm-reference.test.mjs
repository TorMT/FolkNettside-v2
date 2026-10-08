import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {hydrostaticParticulars} from "../src/hydro/stability.js";
import {combinePointWeights,pointWeightsFromLines} from "../src/hydro/point-loads.js";
import {solveFrame2D} from "../src/structure/frame2d.js";
import {structurePanelHTML} from "../src/engineering/structure-panel.js";

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

test("interior point force on Euler-Bernoulli cantilever matches exact tip deflection, rotation and reactions",()=>{
  const L=3,a=1.5,P=-20000,E=210e9,I=8e-6,A=.02;
  const model={nodes:[{id:"root",x:0,y:0},{id:"tip",x:L,y:0}],
    elements:[{id:"beam",n1:"root",n2:"tip",E,A,I}],
    supports:[{node:"root",ux:true,uy:true,rz:true}],
    loads:[],
    pointLoads:[{element:"beam",position:a,fy:P}]};
  const result=solveFrame2D(model),tip=result.nodes[1],root=result.nodes[0];
  near(tip.uy,P*a*a*(3*L-a)/(6*E*I),1e-10);
  near(tip.rz,P*a*a/(2*E*I),1e-10);
  near(root.ry,-P,1e-6);
  near(Math.abs(root.rm),Math.abs(P*a),1e-5);
  // End force at x=L must reproduce original nodal-tip load case.
  model.pointLoads[0].position=L;
  const end=solveFrame2D(model);
  near(end.nodes[1].uy,P*L**3/(3*E*I),1e-10);
  near(end.nodes[0].ry,-P,1e-6);
  // Root load at a=0 causes reaction but no beam bending displacement.
  model.pointLoads[0].position=0;
  const atRoot=solveFrame2D(model);
  near(atRoot.nodes[1].uy,0,1e-10);
  near(atRoot.nodes[0].ry,-P,1e-6);
  model.pointLoads[0].position=L+1;
  assert.throws(()=>solveFrame2D(model),/position/);
});

test("Structure UI visibly places interior point force and exposes editable position",()=>{
  const L=3;
  const base={name:"Beam",nodes:[{id:"root",x:0,y:0},{id:"tip",x:L,y:0}],
    elements:[{id:"beam",n1:"root",n2:"tip",E:210e9,A:.02,I:8e-6}],
    supports:[{node:"root",ux:true,uy:true,rz:true}],
    loads:[{node:"tip",fx:0,fy:-20000,mz:0}]};
  const panel=structurePanelHTML(base,{loadFy:-20000,loadPosition:1.5});
  assert.match(panel.inspector,/id="structure-load-position"/);
  assert.match(panel.inspector,/value="1.5"/);
  assert.match(panel.viewport,/structure-point-load-marker/);
  assert.match(panel.results,/structure-point-load-marker/);
  near(panel.model.pointLoads[0].position,1.5);
  near(panel.result.nodes[1].uy,-20000*1.5**2*(3*3-1.5)/(6*210e9*8e-6),1e-10);
});

test("small-angle roll and pitch lever slopes independently reproduce transverse and longitudinal GM",()=>{
  const hull=box();
  const hydro=executeHydroRequest(hull,"analyze",{waterline:1});
  const p=hydrostaticParticulars(hydro,{density:1025,kg:.5});
  const angle=0.1,rad=angle*Math.PI/180;
  const options={targetVolume:40,centerOfGravity:[0,0,.5],density:1025,
    tolerance:1e-9,maxIterations:80};
  const heelPlus=executeHydroRequest(hull,"attitude",{...options,heelDeg:angle});
  const heelMinus=executeHydroRequest(hull,"attitude",{...options,heelDeg:-angle});
  const pitchPlus=executeHydroRequest(hull,"attitude",{...options,trimDeg:angle});
  const pitchMinus=executeHydroRequest(hull,"attitude",{...options,trimDeg:-angle});
  near(heelPlus.volume,40,1e-7);near(pitchPlus.volume,40,1e-7);
  const gmFromHeel=Math.abs((heelPlus.rollLever-heelMinus.rollLever)/(2*rad));
  const gmFromTrim=Math.abs((pitchPlus.pitchLever-pitchMinus.pitchLever)/(2*rad));
  near(gmFromHeel,p.gmTransverse,0.003);
  near(gmFromTrim,p.gmLongitudinal,0.003);
  assert.ok(gmFromTrim>gmFromHeel*6,"Roll/pitch GM axes were mixed up");
});
test("point loads above/below CG produce correct signed changes in both GMs after redraft",()=>{
  const hull=box();
  const initial=executeHydroRequest(hull,"analyze",{waterline:1});
  const baselineMass=initial.volume*1025/1000;
  const solveLoad=(z)=>{
    const weights=combinePointWeights({
      baselineMassTonnes:baselineMass,baselineCG:[0,0,.5],
      pointWeights:[{massTonnes:2,x:0,y:0,z}]
    });
    const result=executeHydroRequest(hull,"solve",{
      targetVolume:weights.totalMassTonnes*1000/1025,
      minWaterline:0,maxWaterline:3,tolerance:1e-8,maxIterations:80
    });
    const hydro=executeHydroRequest(hull,"analyze",{waterline:result.waterline});
    return {weights,GM:hydrostaticParticulars(hydro,{density:1025,kg:weights.centerOfGravity[2]})};
  };
  const low=solveLoad(-.5),high=solveLoad(3);
  near(low.weights.totalMassTonnes,43);
  near(high.weights.totalMassTonnes,43);
  near(low.GM.volume,43*1000/1025,1e-7);
  near(high.GM.volume,43*1000/1025,1e-7);
  const deltaKg=2*(3-(-.5))/43;
  near(low.GM.gmTransverse-high.GM.gmTransverse,deltaKg,1e-9);
  near(low.GM.gmLongitudinal-high.GM.gmLongitudinal,deltaKg,1e-9);
  assert.ok(low.GM.gmTransverse>high.GM.gmTransverse);
  assert.ok(low.GM.gmLongitudinal>high.GM.gmLongitudinal);
});
