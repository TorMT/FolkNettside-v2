import test from "node:test";
import assert from "node:assert/strict";
import {parseStructuralMembers,deriveLongitudinalSections,stressFromSectionMoment}
 from "../src/structure/girder-section-properties.js";
import {solveHullGirder} from "../src/structure/hull-girder.js";
const G=9.80665;
const close=(a,b,tol=1e-6)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
 "expected "+a+" close to "+b+" +/- "+tol);

const members=parseStructuralMembers(
 "plate,0,10,-1,1,1,1,.1,210,7850\n"+
 "plate,0,10,-1,-1,1,-1,.1,210,7850"
);
const sectionModel=deriveLongitudinalSections(members,{
  xMin:0,xMax:10,referenceE:210e9
});
const solve=extra=>solveHullGirder({
 xMin:0,xMax:10,E:210e9,I:.1,extremeFiberM:.8,segments:8,
 hullMassTonnes:31.4,hullCG:[5,0,0],
 ...extra
});

test("real flange coordinates drive Euler beam EI, not the user's fallback I/c",()=>{
 const derived=solve({sectionModel});
 const reference=solve({I:sectionModel.sections[0].I,
  extremeFiberM:sectionModel.sections[0].extremeFiberM});
 close(derived.frame.elements[0].I,sectionModel.sections[0].I);
 close(derived.maxDeflectionM,reference.maxDeflectionM,1e-12);
 close(derived.maxStressPa,reference.maxStressPa,.001);
 assert.equal(derived.sectionModel.memberCount,2);
 assert.equal(derived.baselineAudit.isExplicit,false);
 assert.equal(derived.equilibriumAudit.passed,true);
 assert.equal(derived.peakStressZ!==null,true);
});

test("mixed material peak stress selects physical member E and fibre, not arbitrary E_ref",()=>{
 const composite=deriveLongitudinalSections(parseStructuralMembers(
  "plate,0,10,-1,1,1,1,.1,210,7850\n"+
  "plate,0,10,-1,-1,1,-1,.1,70,2700"
 ),{xMin:0,xMax:10,referenceE:210e9});
 const fromModel=solve({sectionModel:composite});
 const peak=fromModel.moments.reduce((a,p)=>
   !a||Math.abs(p.stressPa)>Math.abs(a.stressPa)?p:a,null);
 const expected=stressFromSectionMoment(composite.sections[0],peak.value);
 close(fromModel.maxStressPa,Math.abs(expected.stressPa),.001);
 assert.equal(fromModel.peakStressMember,expected.memberIndex);
 assert.equal(fromModel.peakStressZ,expected.z);
 assert.ok(composite.sections[0].zNeutral>0);
});

test("structural material weight only becomes vessel baseline when explicitly supplied and matches mass/LCG",()=>{
 const composite=deriveLongitudinalSections(parseStructuralMembers(
  "plate,0,5,0,-1,0,1,.1,210,7850\n"+
  "plate,5,10,0,-1,0,1,.2,210,7850"
 ),{xMin:0,xMax:10});
 const mass=composite.totalStructuralMassTonnes;
 const cg=composite.structuralLCG;
 const result=solve({sectionModel:composite,massStations:composite.massStations,
  hullMassTonnes:mass,hullCG:[cg,0,0]});
 close(result.baselineAudit.totalMassTonnes,mass);
 close(result.baselineAudit.centerX,cg);
 close(result.gravityForceN,-mass*1000*G,.01);
 assert.equal(result.baselineAudit.isExplicit,true);
 const reactionRight=result.reactions.find(r=>Math.abs(r.x-10)<1e-9);
 close(reactionRight.verticalN,mass*1000*G*cg/10,.03);
 assert.throws(()=>solve({sectionModel:composite,massStations:composite.massStations}),
  /integrates to/);
 assert.throws(()=>solve({sectionModel:composite,massStations:composite.massStations,
   hullMassTonnes:mass,hullCG:[5,0,0]}),/LCG/);
});

test("unsafe ambiguous manual versus derived E/I is explicitly refused",()=>{
 assert.throws(()=>solve({sectionModel,stiffnessStations:[
  {x0:0,x1:10,E:210e9,I:.01}]}),/either calculated/);
 assert.throws(()=>solve({sectionModel:{sections:[{x0:0,x1:10,I:1,E:210e9}]}}),
  /calculated structural sections are invalid/);
});
