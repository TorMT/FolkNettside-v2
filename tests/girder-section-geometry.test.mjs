import test from "node:test";
import assert from "node:assert/strict";
import {parseStructuralMembers,deriveLongitudinalSections}
 from "../src/structure/girder-section-properties.js";
import {membersOverlapAreaM2,structuralOverlapAudit,memberFootprint}
 from "../src/structure/girder-section-geometry.js";
const parse=rows=>parseStructuralMembers(rows);

test("exact convex-rectangle intersection catches finite material double-counting",()=>{
 const [a,b]=parse("plate,0,10,-1,0,1,0,.2,210,7850\n"+
                    "plate,0,10,0,-1,0,1,.2,210,7850");
 const area=membersOverlapAreaM2(a,b);
 assert.ok(Math.abs(area-.04)<1e-9,"Crossing strips intersection should be 0.2x0.2");
 const audit=structuralOverlapAudit([a,b]);
 assert.equal(audit.passed,false);
 assert.equal(audit.warnings.length,1);
 assert.ok(audit.warnings[0].description.includes("overlap"));
 assert.throws(()=>deriveLongitudinalSections([a,b],{xMin:0,xMax:10}),/overlap/);
});

test("two touching flanges or adjoining longitudinal stations are never false overlap errors",()=>{
 const [a,b]=parse("plate,0,5,-1,0,0,0,.2,210,7850\n"+
                    "plate,0,5,0,0,1,0,.2,210,7850");
 assert.ok(membersOverlapAreaM2(a,b)<1e-10);
 assert.equal(structuralOverlapAudit([a,b]).passed,true);
 const [left,right]=parse("plate,0,5,0,-1,0,1,.1,210,7850\n"+
                         "plate,5,10,0,-1,0,1,.1,210,7850");
 assert.equal(structuralOverlapAudit([left,right]).passed,true);
 assert.equal(deriveLongitudinalSections([left,right],{xMin:0,xMax:10}).sections.length,2);
});

test("plate-stiffener overlap recognized, then corrected by moving stiffener clear of plate",()=>{
 const [plate,stiffener]=parse(
  "plate,0,10,-1,0,1,0,.2,210,7850\n"+
  "stiffener,0,10,0,0,.2,.4,210,7850");
 const area=membersOverlapAreaM2(plate,stiffener);
 assert.ok(Math.abs(area-.04)<1e-9);
 const moved={...stiffener,z:.3};
 assert.equal(structuralOverlapAudit([plate,moved]).passed,true);
 assert.equal(memberFootprint(moved).length,4);
 assert.ok(deriveLongitudinalSections([plate,moved],{xMin:0,xMax:10}).sections[0].I>0);
});

test("cross-section sanity check rejects wrong member shapes and avoids unlimited loops",()=>{
 assert.throws(()=>memberFootprint({kind:"plate",y0:0,y1:0,z0:0,z1:0,t:1}),/Invalid plate/);
 assert.throws(()=>structuralOverlapAudit([{},{}]),/Invalid structural section/);
 const [a,b]=parse("plate,0,10,0,0,1,0,.2,210,7850\n"+
                   "plate,0,10,0,0,1,0,.2,210,7850");
 assert.throws(()=>structuralOverlapAudit([a,b],{maxChecks:0}),/Too many/);
});
