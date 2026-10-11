import test from "node:test";
import assert from "node:assert/strict";
import {parseGirderStations,validateGirderProfile,baselineMassAudit,girderProfileAt}
  from "../src/structure/girder-profiles.js";
import {solveHullGirder} from "../src/structure/hull-girder.js";
const G=9.80665;
const close=(a,b,tol=1e-5)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
  "Expected "+a+" close to "+b+" +/- "+tol);
const beam=(extra={})=>solveHullGirder({
 xMin:0,xMax:10,hullMassTonnes:50,hullCG:[5,0,1],
 E:210e9,I:.2,extremeFiberM:1,segments:8,...extra
});

test("longitudinal parser ignores comments but rejects missing, infinite and negative values",()=>{
 const stiffness=parseGirderStations(
   "# x0,x1,E_GPa,I_m4\n0,5,210,.1 # aft\n5,10,200,.2\n",
   {kind:"stiffness"});
 assert.equal(stiffness.length,2);
 assert.equal(stiffness[0].E,210e9);
 assert.equal(stiffness[1].I,.2);
 const mass=parseGirderStations("0,5,2\n5,10,8\n",{kind:"mass"});
 assert.equal(mass[0].tonnesPerM,2);
 assert.throws(()=>parseGirderStations("0,5,210",{kind:"stiffness"}),/requires 4/);
 assert.throws(()=>parseGirderStations("0,5,1,Infinity",{kind:"stiffness"}),/finite/);
 assert.throws(()=>parseGirderStations("0,5,-1",{kind:"mass"}),/cannot be negative/);
 assert.throws(()=>parseGirderStations("0,,3",{kind:"mass"}),/required/);
 assert.throws(()=>parseGirderStations("1,1,3",{kind:"mass"}),/x1 > x0/);
});

test("full-span station validation rejects gap, overlap and an incomplete last interval",()=>{
 const opts={xMin:0,xMax:10,kind:"mass"};
 const parse=text=>parseGirderStations(text,{kind:"mass"});
 assert.throws(()=>validateGirderProfile(parse("0,5,2\n5.1,10,8"),opts),/continuously/);
 assert.throws(()=>validateGirderProfile(parse("0,5,2\n4.9,10,8"),opts),/continuously/);
 assert.throws(()=>validateGirderProfile(parse("0,5,2\n5,9,8"),opts),/final station/);
 assert.throws(()=>validateGirderProfile(parse("0,5,2\n5,11,8"),opts),/final station/);
 const valid=validateGirderProfile(parse("0,5,2\n5,10,8"),opts);
 assert.equal(valid.length,2);
 assert.equal(girderProfileAt(valid,8).tonnesPerM,8);
 assert.equal(validateGirderProfile([],{...opts}),null);
});

test("uneven baseline mass integrates to total mass and true longitudinal centroid",()=>{
 const m=parseGirderStations("0,5,2\n5,10,8",{kind:"mass"});
 const audit=baselineMassAudit(m,{hullMassTonnes:50,hullCGx:6.5,xMin:0,xMax:10});
 close(audit.totalMassTonnes,50);
 close(audit.centerX,6.5);
 close(audit.firstMomentTonnesM,325);
 assert.equal(audit.isExplicit,true);
 assert.throws(()=>baselineMassAudit(m,{hullMassTonnes:60,hullCGx:6.5,xMin:0,xMax:10}),/integrates to/);
 assert.throws(()=>baselineMassAudit(m,{hullMassTonnes:50,hullCGx:5,xMin:0,xMax:10}),/LCG/);
});

test("variable stiffness changes internal deflection, not vertical reactions for the same loads",()=>{
 const noProfile=beam();
 const stiff=parseGirderStations("0,5,210,.05\n5,10,210,.2",{kind:"stiffness"});
 const profiled=beam({stiffnessStations:stiff});
 assert.equal(profiled.frame.elements[0].I,.05);
 assert.equal(profiled.frame.elements.at(-1).I,.2);
 assert.ok(profiled.maxDeflectionM>noProfile.maxDeflectionM*1.2);
 close(profiled.reactionN,noProfile.reactionN,.01);
 close(profiled.equilibriumAudit.momentResidualNm,0,.01);
 assert.ok(profiled.frame.nodes.some(n=>n.x===5));
 assert.equal(profiled.stiffnessStations.length,2);
 const expectedStress=Math.max(...profiled.moments.map(p=>Math.abs(p.value)*1/
   profiled.frame.elements.find(e=>e.id===p.elementId).I));
 close(profiled.maxStressPa,expectedStress,.001);
 const uniformApprox=Math.abs(profiled.moments.reduce((a,p)=>
   Math.abs(p.value)>Math.abs(a.value)?p:a,profiled.moments[0]).value)/.2;
 assert.ok(profiled.maxStressPa>uniformApprox,
  "Local smaller-I station must not be reported with global inertia");

});

test("variable baseline mass shifts pin-roller reaction in agreement with analytic static equilibrium",()=>{
 const m=parseGirderStations("0,5,2\n5,10,8",{kind:"mass"});
 const loaded=beam({hullCG:[6.5,0,1],massStations:m});
 const left=loaded.reactions.find(r=>Math.abs(r.x)<1e-8);
 const right=loaded.reactions.find(r=>Math.abs(r.x-10)<1e-8);
 close(left.verticalN,50*1000*G*(1-6.5/10),.01);
 close(right.verticalN,50*1000*G*6.5/10,.01);
 assert.equal(loaded.equilibriumAudit.passed,true);
 assert.equal(loaded.baselineAudit.centerX,6.5);
 const aft=loaded.lineLoads.find(l=>l.to<=5);
 const fore=loaded.lineLoads.find(l=>l.from>=5);
 assert.ok(aft.gravityQ>fore.gravityQ);
 assert.throws(()=>beam({hullCG:[5,0,1],massStations:m}),/LCG/);
});

test("legacy uniform solver remains exactly the same when both profiles are absent",()=>{
 const traditional=beam();
 const withEmpty=beam({stiffnessStations:[],massStations:[]});
 close(traditional.maxMomentNm,withEmpty.maxMomentNm);
 close(traditional.maxDeflectionM,withEmpty.maxDeflectionM,1e-12);
 assert.deepEqual(traditional.lineLoads,withEmpty.lineLoads);
 assert.equal(withEmpty.baselineAudit.isExplicit,false);
});

test("different section moduli require local stress calculation even when global E/I are fixed",()=>{
 const stiff=parseGirderStations("0,5,105,.1\n5,10,210,.2",{kind:"stiffness"});
 const result=beam({stiffnessStations:stiff,pointWeights:[{massTonnes:2,x:3,y:0,z:1}]});
 assert.equal(result.equilibriumAudit.passed,true);
 for(const end of result.moments){
   const element=result.frame.elements.find(e=>e.id===end.elementId);
   close(end.stressPa,end.value*1/element.I,.002);
 }
 assert.equal(result.peakStressElement, result.moments.find(x=>
   Math.abs(x.stressPa)===result.maxStressPa)?.elementId);
 assert.ok(result.maxStressX>=0&&result.maxStressX<=10);
});
