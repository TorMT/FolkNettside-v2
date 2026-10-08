import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,wedgePrismMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {hydrostaticParticulars} from "../src/hydro/stability.js";
import {areaLoadsFromLines,combineHullLoading} from "../src/hydro/hull-loading.js";
import {solveHullGirder} from "../src/structure/hull-girder.js";
import {stressAtHullPoint,stressRGB,stressLegend,interpolateGirderAt} from "../src/structure/hull-contours.js";
import {hullGirderDiagram,hullGirderPanelHTML} from "../src/engineering/hull-girder-panel.js";
import {solveFrame2D} from "../src/structure/frame2d.js";

const near=(actual,expected,tol=1e-6)=>assert.ok(
  Number.isFinite(actual)&&Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),
  `Expected ${actual} ≈ ${expected} within relative ${tol}`);
const makeBox=(L,B,H)=>({name:"Reference box",unitScaleToMeters:1,components:[{
  id:"hull",name:"Box",geometry:boxMesh({L,B,H}),metadata:{hydro:true}
}]});
test("uniform rectangle integrates mass and CG independently of the mesh",()=>{
 const rectangles=areaLoadsFromLines("0.25,-2,2,-1,1,2");
 const state=combineHullLoading({hullMassTonnes:25,hullCG:[0,0,.5],
   pointWeights:[{massTonnes:1,x:2,y:1,z:3}],areaLoads:rectangles});
 near(state.areaMassTonnes,2);
 near(state.totalMassTonnes,28);
 near(state.centerOfGravity[0],2/28);
 near(state.centerOfGravity[1],1/28);
 near(state.centerOfGravity[2],(25*.5+3+4)/28);
 assert.equal(state.areaLoads[0].areaM2,8);
});
test("GM in BOTH directions follows independent barge formulas on two different hull geometries",()=>{
 for(const [L,B,H,hullMass,points,patches] of [
   [10,4,3,39,[{massTonnes:1,x:2,y:1,z:2}],
     areaLoadsFromLines("0.5,-1,1,-1,1,2")],
   [12,6,4,70,[{massTonnes:3,x:-2,y:-1,z:2.5}],
     areaLoadsFromLines("0.2,-3,3,-1.5,1.5,3")]
 ]){
   const rho=1025,model=makeBox(L,B,H);
   const state=combineHullLoading({hullMassTonnes:hullMass,
     hullCG:[0,0,.5],pointWeights:points,areaLoads:patches});
   const T=state.totalMassTonnes*1000/(rho*L*B);
   const solved=executeHydroRequest(model,"solve",{
     targetVolume:state.totalMassTonnes*1000/rho,minWaterline:0,
     maxWaterline:H,tolerance:1e-8,maxIterations:80
   });
   near(solved.waterline,T,1e-8);
   const result=executeHydroRequest(model,"analyze",{waterline:solved.waterline});
   const gm=hydrostaticParticulars(result,{density:rho,kg:state.centerOfGravity[2]});
   near(gm.gmTransverse,T/2+B*B/(12*T)-state.centerOfGravity[2]);
   near(gm.gmLongitudinal,T/2+L*L/(12*T)-state.centerOfGravity[2]);
   near(gm.displacementTonnes,state.totalMassTonnes);
   assert.ok(gm.gmLongitudinal>gm.gmTransverse);
   const heel=executeHydroRequest(model,"equilibrium",{
     axis:"heel",minAngle:-18,maxAngle:18,
     targetVolume:state.totalMassTonnes*1000/rho,
     centerOfGravity:state.centerOfGravity,leverTolerance:1e-6,maxIterations:80
   });
   near(heel.volume,state.totalMassTonnes*1000/rho,1e-6);
   assert.ok(Math.abs(heel.residual)<=1e-6);
 }
});
test("invalid rectangles and misplaced structural loads are rejected",()=>{
 assert.throws(()=>areaLoadsFromLines("0.4,1,2"),/Area load line/);
 assert.throws(()=>combineHullLoading({hullMassTonnes:0,hullCG:[0,0,0]}),/mass must be positive/);
 assert.throws(()=>combineHullLoading({hullMassTonnes:3,hullCG:[0,0,1],
   areaLoads:[{densityTonnesPerM2:1,x0:5,x1:3,y0:0,y1:2,z:1}]}),/positive/);
 assert.throws(()=>solveHullGirder({xMin:0,xMax:5,hullMassTonnes:3,hullCG:[0,0,1],
   areaLoads:[{densityTonnesPerM2:1,x0:4,x1:6,y0:0,y1:1,z:1}],
   E:210e9,I:.08,extremeFiberM:1}),/outside the beam span/);
});
test("uniform distributed beam load has exact nodal reactions, moment, stress and deflection",()=>{
 const L=10,E=210e9,I=.08,c=1,mass=20,G=9.80665;
 const q=mass*1000*G/L;
 const beam=solveHullGirder({xMin:0,xMax:L,hullMassTonnes:mass,
   hullCG:[L/2,0,1],E,I,extremeFiberM:c,segments:20});
 near(beam.reactions[0].verticalN,q*L/2,1e-8);
 near(beam.reactions.at(-1).verticalN,q*L/2,1e-8);
 near(beam.equilibriumResidualN,0,1e-7);
 near(beam.maxMomentNm,q*L*L/8,1e-8);
 near(beam.maxStressPa,q*L*L*c/(8*I),1e-8);
 near(beam.maxDeflectionM,5*q*L**4/(384*E*I),1e-8);
 const legend=stressLegend(beam.maxStressPa);
 near(legend.maxMPa,-legend.minMPa);
 const atTop=stressAtHullPoint(beam,5,2,{neutralZ:1});
 const atBottom=stressAtHullPoint(beam,5,0,{neutralZ:1});
 near(atTop,-atBottom);
 near(stressAtHullPoint(beam,5,1,{neutralZ:1}),0);
 const blue=stressRGB(-beam.maxStressPa,beam.maxStressPa);
 const red=stressRGB(beam.maxStressPa,beam.maxStressPa);
 assert.notDeepEqual(blue,red);
 assert.match(hullGirderDiagram(beam),/svg/);
 assert.match(hullGirderPanelHTML({result:beam,caseInput:{}}).results,/MPa/);
});
test("mid-span POINT LOAD produces analytic shear jump and exact peak moment",()=>{
 const L=10,E=210e9,I=.08,c=1,mass=1,added=2,G=9.80665;
 const q=mass*1000*G/L,P=added*1000*G;
 const beam=solveHullGirder({xMin:0,xMax:L,hullMassTonnes:mass,
   hullCG:[5,0,1],pointWeights:[{massTonnes:added,x:5,y:0,z:1}],
   E,I,extremeFiberM:c,segments:12});
 near(beam.reactionN,(mass+added)*1000*G,1e-8);
 near(beam.equilibriumResidualN,0);
 near(beam.maxMomentNm,q*L*L/8+P*L/4,1e-8);
 near(beam.maxDeflectionM,5*q*L**4/(384*E*I)+P*L**3/(48*E*I),1e-7);
 const moment=interpolateGirderAt(beam.field,5).momentNm;
 near(Math.abs(moment),beam.maxMomentNm,1e-8);
 const jumps=beam.shears.filter(item=>Math.abs(item.x-5)<1e-9);
 assert.ok(jumps.length>=2);
 near(Math.abs(jumps[0].value-jumps.at(-1).value),P,1e-7);
});
test("area mass patch becomes exact piecewise uniform structural force and reactions balance",()=>{
 const patch={densityTonnesPerM2:.1,x0:2,x1:5,y0:-2,y1:2,z:2};
 const beam=solveHullGirder({xMin:0,xMax:10,hullMassTonnes:10,hullCG:[5,0,1],
   areaLoads:[patch],E:210e9,I:.08,extremeFiberM:1,segments:10});
 near(beam.loading.areaMassTonnes,1.2);
 near(beam.reactionN,11.2*1000*9.80665);
 near(beam.equilibriumResidualN,0,1e-7);
 assert.ok(beam.lineLoads.some(load=>load.from===2&&load.to===3));
 const loaded=beam.lineLoads.find(load=>load.from===2);
 const outside=beam.lineLoads.find(load=>load.from===0);
 assert.ok(loaded.qy<outside.qy);
});

test("sloping-deck wedge hull: both GM axes match independent partial-waterplane integrals",()=>{
 const L=10,B=4,H0=.5,H1=2,T=1.2,rho=1025,KG=.8;
 const documentModel={name:"Deck wedge",unitScaleToMeters:1,components:[{
    id:"wedge",name:"Sloping deck",geometry:wedgePrismMesh({L,B,H0,H1}),
    metadata:{hydro:true}
 }]};
 const dH=H1-H0,partial=(H1-T)/dH;
 const Lwet=L*partial;
 const volume=B*L*(T-(T-H0)**2/(2*dH));
 const kbMoment=B/2*(L/dH*(T**3-H0**3)/3+L*partial*T*T);
 const KB=kbMoment/volume;
 const Ixx=Lwet*B**3/12;
 const Iyy=B*Lwet**3/12;
 const hydro=executeHydroRequest(documentModel,"analyze",{waterline:T});
 const particulars=hydrostaticParticulars(hydro,{density:rho,kg:KG});
 near(hydro.volume,volume,1e-7);
 near(hydro.waterplane.area,B*Lwet,1e-7);
 near(hydro.waterplane.ixx,Ixx,1e-7);
 near(hydro.waterplane.iyy,Iyy,1e-7);
 near(hydro.centerOfBuoyancy[2],KB,1e-7);
 near(particulars.gmTransverse,KB+Ixx/volume-KG,1e-7);
 near(particulars.gmLongitudinal,KB+Iyy/volume-KG,1e-7);
});
