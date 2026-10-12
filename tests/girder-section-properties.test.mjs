import test from "node:test";
import assert from "node:assert/strict";
import {
  parseStructuralMembers,sectionProperties,stressFromSectionMoment,
  deriveLongitudinalSections
} from "../src/structure/girder-section-properties.js";
const near=(a,b,eps=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=eps,
  "expected "+a+" close to "+b);

test("two horizontal flanges yield exact neutral axis, plate self-inertia, weight and EI",()=>{
 const members=parseStructuralMembers(
  "# plate, x0,x1,y0,z0,y1,z1,t,E_GPa,rho\n"+
  "plate,0,10,-1,1,1,1,.1,210,7850\n"+
  "plate,0,10,-1,-1,1,-1,.1,210,7850"
 );
 const section=sectionProperties(members);
 near(section.zNeutral,0);
 near(section.areaM2,.4);
 near(section.geometricalI,2*(.2+(2*.1**3)/12));
 near(section.I,section.geometricalI);
 near(section.EI,section.I*210e9,.01);
 near(section.tonnesPerM,3.14);
 near(section.extremeFiberM,1.05);
 const stress=stressFromSectionMoment(section,1e6);
 near(Math.abs(stress.stressPa),1e6*1.05/section.I,1e-7);
 assert.equal(stress.kind,"plate");
 const assembled=deriveLongitudinalSections(members,{xMin:0,xMax:10});
 near(assembled.totalStructuralMassTonnes,31.4);
 near(assembled.structuralLCG,5);
});

test("single vertical web includes exact rectangular second moment",()=>{
 const section=sectionProperties(parseStructuralMembers(
  "plate,0,2,0,-1,0,1,.1,210,7850"
 ));
 near(section.areaM2,.2);
 near(section.I, .1*2**3/12);
 near(section.zMin,-1);
 near(section.zMax,1);
});
test("rectangular stiffener area and vertical inertia are exact",()=>{
 const s=sectionProperties(parseStructuralMembers(
  "stiffener,0,10,0,1,.2,.6,210,7850"
 ));
 near(s.areaM2,.12);
 near(s.geometricalI,.2*.6**3/12);
 near(s.zMin,.7);
 near(s.zMax,1.3);
 near(s.tonnesPerM,.12*7.85);
});
test("mixed-material elastic neutral axis and peak member stress use constituent E",()=>{
 const s=sectionProperties(parseStructuralMembers(
  "plate,0,10,-1,1,1,1,.1,210,7850\n"+
  "plate,0,10,-1,-1,1,-1,.1,70,2700"
 ));
 near(s.zNeutral,.5);
 const stresses=s.stressFibers.map(p=>
  p.E*1e6*(p.z-s.zNeutral)/s.EI);
 const extreme=Math.max(...stresses.map(Math.abs));
 near(Math.abs(stressFromSectionMoment(s,1e6).stressPa),extreme,1e-7);
 assert.ok(s.I>0);
});
test("two stations have independent E/I/NA/mass and reject missing span",()=>{
 const members=parseStructuralMembers(
  "plate,0,5,0,-1,0,1,.1,210,7850\n"+
  "stiffener,0,5,0,1,.2,.1,210,7850\n"+
  "plate,5,10,0,-1,0,1,.15,210,7850"
 );
 const derived=deriveLongitudinalSections(members,{xMin:0,xMax:10,referenceE:210e9});
 assert.equal(derived.sections.length,2);
 assert.equal(derived.memberCount,3);
 assert.notEqual(derived.sections[0].zNeutral,derived.sections[1].zNeutral);
 assert.notEqual(derived.sections[0].I,derived.sections[1].I);
 assert.ok(derived.totalStructuralMassTonnes>0);
 assert.throws(()=>deriveLongitudinalSections(members,{xMin:0,xMax:11}),/final station/);
});
test("malformed and dangerously incomplete cross-section rows are rejected",()=>{
 const parse=parseStructuralMembers;
 assert.throws(()=>parse("plate,0,1,0,0,1,1,0,210,7850"),/positive/);
 assert.throws(()=>parse("plate,0,1,0,0,0,0,.01,210,7850"),/distinct/);
 assert.throws(()=>parse("stiffener,0,1,0,0,-.1,.2,210,7850"),/positive/);
 assert.throws(()=>parse("plate,0,1,0,0,1,1,.01,210"),/column count/);
 assert.throws(()=>parse("plate,0,1,0,0,1,1,.01,NaN,7850"),/finite/);
 assert.throws(()=>parse("stiffener,0,1,0,0,.1,.2,0,7850"),/positive/);
 assert.throws(()=>parse("rod,0,1"),/plate or stiffener/);
 assert.throws(()=>parse("plate,1,0,0,0,1,1,.01,210,7850"),/x1 > x0/);
});
