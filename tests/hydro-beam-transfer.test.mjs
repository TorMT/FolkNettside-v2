import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,wedgePrismMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {projectPressureToBeam} from "../src/structure/hydro-beam-transfer.js";
import {solveHullGirder} from "../src/structure/hull-girder.js";
const G=9.80665;
const close=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(tol,Math.abs(b)*1e-8),
  "expected "+a+" ≈ "+b);
const makeModel=(geometry)=>({unitScaleToMeters:1,components:[{
  id:"hull",name:"Verified analytic external surface",geometry,metadata:{hydro:true}
}]});
const pressure=(geometry,waterline=1,sections=12)=>{
  const m=makeModel(geometry);
  return executeHydroRequest(m,"pressure",{waterline,densityKgM3:1000,sections});
};
const beam=(buoyancyTransfer,extra={})=>solveHullGirder({
 xMin:-5,xMax:5,hullMassTonnes:40,hullCG:[0,0,.5],
 E:210e9,I:.08,extremeFiberM:1,segments:12,
 buoyancyTransfer,...extra
});
test("clipped box pressure has station forces uniform along X and exact first moment",()=>{
 const p=pressure(boxMesh({L:10,B:4,H:3}),1,12);
 assert.equal(p.crossCheck.passed,true);
 assert.equal(p.stationAudit.passed,true);
 close(p.stationAudit.forceErrorN,0);
 close(p.strips.reduce((s,x)=>s+x.firstMomentXN,0),0,1e-6);
 for(const s of p.strips){
   close(s.forceZKN,40*1000*G/12/1000,1e-5);
   close(s.firstMomentXN,s.forceZKN*1000*(s.x0+s.x1)/2,.01);
 }
 const transfer=projectPressureToBeam(p,{xMin:-5,xMax:5});
 assert.equal(transfer.conservation.passed,true);
 close(transfer.totalForceN,40*1000*G);
 close(transfer.totalFirstMomentXN,0);
 close(transfer.nodalCorrections.reduce((a,x)=>a+x.fy,0),0,1e-8);
 const b=beam(transfer,{supportModel:"floating-equilibrium"});
 close(b.verticalLoadN,0,.05);
 close(b.reactionN,0,.05);
 close(b.buoyancyForceN,-b.gravityForceN);
 close(b.equilibriumResidualN,0,.05);
 close(b.maxMomentNm,0,1e-4);
 close(b.maxStressPa,0,1e-3);
 close(b.netBeamMomentNm,0,.01);
 close(b.pitchCoupleNm,0,.01);
});
test("off-equilibrium added mass gives clear floating-block, but explicit pinned/roller fixture reacts",()=>{
 const p=pressure(boxMesh({L:10,B:4,H:3}));
 const transfer=projectPressureToBeam(p,{xMin:-5,xMax:5});
 assert.throws(()=>beam(transfer,{supportModel:"floating-equilibrium",
   pointWeights:[{massTonnes:1,x:0,y:0,z:1}]}),/nonzero vertical force/);
 const supported=beam(transfer,{supportModel:"pinned-roller",
   pointWeights:[{massTonnes:1,x:0,y:0,z:1}]});
 close(supported.reactionN,1000*G);
 close(supported.verticalLoadN,-1000*G);
 close(supported.equilibriumResidualN,0);
});
test("eccentric added mass has moment and requires support reactions in constrained fixture",()=>{
 const p=pressure(boxMesh({L:10,B:4,H:3}));
 const transfer=projectPressureToBeam(p,{xMin:-5,xMax:5});
 const loads=[{massTonnes:1,x:3,y:0,z:1}];
 assert.throws(()=>beam(transfer,{supportModel:"floating-equilibrium",
   pointWeights:loads}),/nonzero vertical force or longitudinal moment/);
 const supported=beam(transfer,{supportModel:"pinned-roller",pointWeights:loads});
 close(supported.reactionN,1000*G);
 close(supported.netFirstMomentXN,-1000*G*3);
});
test("wedge pressure projection conserves force and longitudinal first moment through nonuniform strips",()=>{
 const p=pressure(wedgePrismMesh({L:8,B:2,H0:.5,H1:2}),1.2,16);
 assert.equal(p.stationAudit.passed,true);
 assert.equal(p.crossCheck.passed,true);
 const transferred=projectPressureToBeam(p,{xMin:-4,xMax:4});
 close(transferred.totalForceN,p.forceN[2]);
 close(transferred.totalFirstMomentXN,p.strips.reduce((a,x)=>a+x.firstMomentXN,0));
 close(transferred.totalFirstMomentXN+transferred.equivalentPitchCoupleNm,
   -p.momentNm[1],.01);
 close(transferred.totalFirstMomentXN+transferred.equivalentPitchCoupleNm,
   p.reference.centerOfBuoyancy[0]*p.forceN[2],.01);
 close(transferred.conservation.beamMomentErrorNm,0,.01);
 let nodalXN=0,uniformXN=0;
 for(const x of transferred.nodalCorrections)nodalXN+=x.x*x.fy;
 for(const l of transferred.lineLoads)uniformXN+=l.qy*(l.to-l.from)*(l.from+l.to)/2;
 close(nodalXN+uniformXN,transferred.totalFirstMomentXN,.01);
});
test("unvalidated source, invalid span and missing station audit cannot silently transfer buoyancy",()=>{
 const p=pressure(boxMesh({L:10,B:4,H:3}));
 const bad=structuredClone(p);
 bad.crossCheck.passed=false;
 assert.throws(()=>projectPressureToBeam(bad,{xMin:-5,xMax:5}),/requires passing/);
 assert.throws(()=>projectPressureToBeam(p,{xMin:-4,xMax:5}),/outside structural beam/);
 assert.throws(()=>projectPressureToBeam({...p,stationAudit:undefined},{xMin:-5,xMax:5}),/requires passing/);
 assert.throws(()=>solveHullGirder({xMin:-5,xMax:5,hullMassTonnes:40,hullCG:[0,0,0],
   E:210e9,I:.08,extremeFiberM:1,supportModel:"floating-equilibrium"}),/requires/);
 assert.throws(()=>beam(projectPressureToBeam(p,{xMin:-5,xMax:5}),
   {supportModel:"floating-equilibrium",hullCG:[1,0,1]}),/hull CG at mid-span/);
});

test("full pitch moment is mapped as equivalent beam couple when horizontal facet forces matter",()=>{
 const p=pressure(wedgePrismMesh({L:8,B:2,H0:.5,H1:2}),1.2,16);
 const t=projectPressureToBeam(p,{xMin:-4,xMax:4});
 close(t.totalFirstMomentXN+t.equivalentPitchCoupleNm,-p.momentNm[1],.01);
 // The structural equivalent carries the entire hydro pitch moment; it is
 // not interchangeable with the first moment of vertical force alone.
 assert.ok(Number.isFinite(t.equivalentPitchCoupleNm));
 const m=solveHullGirder({
   xMin:-4,xMax:4,hullMassTonnes:15,hullCG:[0,0,.5],
   E:210e9,I:.08,extremeFiberM:1,segments:12,
   buoyancyTransfer:t,supportModel:"pinned-roller"
 });
 close(m.netBeamMomentNm,m.gravityForceN*0-p.momentNm[1],.05);
 close(m.equilibriumResidualN,0,.1);
 assert.ok(m.reactionN!==0);
});
