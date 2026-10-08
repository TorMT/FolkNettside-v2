import test from "node:test";
import assert from "node:assert/strict";
import {legacyAddedWaveResistance,legacyMorisonWaveForce} from "../src/model/wave-concept-estimates.js";

const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
  "Expected "+a+" close to "+b);
test("legacy added resistance preserves head-sea convention and scales with square of speed",()=>{
 const base={lwlM:30,bwlM:8,shipSpeedMs:3,waveHeightM:1.2,cAdded:.12};
 const head=legacyAddedWaveResistance({...base,waveHeadingDeg:180});
 const following=legacyAddedWaveResistance({...base,waveHeadingDeg:0});
 assert.ok(head.addedResistanceN>0);
 near(following.addedResistanceN,0);
 const zero=legacyAddedWaveResistance({...base,shipSpeedMs:0,waveHeadingDeg:180});
 near(zero.addedResistanceN,0);
 assert.match(head.provenance,/not a validated model/);
});
test("legacy Morison estimate retains explicit drag/inertia and conservative meaning",()=>{
 const a=legacyMorisonWaveForce({waveHeightM:2,wavePeriodS:5,headingDeg:180,
  projectedAreaM2:10,volumeM3:3});
 near(a.forcePeakN,a.dragN+a.inertiaN);
 assert.ok(a.inertiaN>0&&a.dragN>0);
 const beam=legacyMorisonWaveForce({waveHeightM:2,wavePeriodS:5,headingDeg:90,
  projectedAreaM2:10,volumeM3:3});
 assert.ok(Math.abs(beam.forcePeakN)<1e-9);
 assert.match(a.provenance,/NOT valid/);
});
test("concept estimate inputs must be supplied, not silently inferred from loaded CAD",()=>{
 assert.throws(()=>legacyAddedWaveResistance({lwlM:"",bwlM:4,shipSpeedMs:3,waveHeightM:2}),/required/);
 assert.throws(()=>legacyMorisonWaveForce({waveHeightM:1,wavePeriodS:5,projectedAreaM2:"",volumeM3:2}),/required/);
});
