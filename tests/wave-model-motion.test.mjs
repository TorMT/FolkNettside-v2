import test from "node:test";
import assert from "node:assert/strict";
import {normaliseWaveCase,waveElevation} from "../src/model/wave-core.js";
import {waveModelPose,waveModelHeave} from "../src/model/wave-model-motion.js";
const near=(a,b,eps=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=eps,
  `expected ${a} ≈ ${b}`);

test("still/vertical-only modes never invent pitch or roll",()=>{
 const wave=normaliseWaveCase({heightM:2,periodS:5,headingDeg:35});
 assert.deepEqual(waveModelPose(wave,0,"anchored"),{
   heaveM:0,rollRad:0,pitchRad:0,slopeX:0,slopeY:0
 });
 const follow=waveModelPose(wave,1.2,"follow",7,-2);
 near(follow.heaveM,waveElevation(wave,7,-2,1.2));
 near(follow.rollRad,0);near(follow.pitchRad,0);
 near(waveModelHeave(wave,1.2,"follow",7,-2),follow.heaveM);
 assert.equal(waveModelHeave(null,20,"follow"),0);
 assert.throws(()=>waveModelPose(wave,0,"RAO"),/Unknown/);
});
test("local wave tangent produces pitch for head seas and roll for beam seas",()=>{
 const head=normaliseWaveCase({heightM:1.5,periodS:6,headingDeg:0,phaseDeg:90});
 const a=waveModelPose(head,0,"follow-slope");
 near(a.heaveM,0);
 near(a.rollRad,0);
 const expected=Math.atan(head.amplitudeM*head.waveNumber);
 near(a.pitchRad,expected);
 const beam=normaliseWaveCase({heightM:1.5,periodS:6,headingDeg:90,phaseDeg:90});
 const b=waveModelPose(beam,0,"follow-slope");
 near(b.heaveM,0);
 near(b.pitchRad,0);
 near(b.rollRad,-expected);
});
test("wave motion matches spatially offset model reference, not world origin",()=>{
 const wave=normaliseWaveCase({heightM:1.8,periodS:6,headingDeg:45});
 const x=13.5,y=-4.2,t=1.3;
 const pose=waveModelPose(wave,t,"follow-slope",x,y);
 near(pose.heaveM,waveElevation(wave,x,y,t));
 assert.notEqual(pose.heaveM,waveElevation(wave,0,0,t));
});
test("visual tilt is bounded even for steep short waves",()=>{
 const wave=normaliseWaveCase({heightM:20,periodS:2,headingDeg:35,phaseDeg:90});
 const pose=waveModelPose(wave,0,"follow-slope",0,0);
 const bound=12*Math.PI/180;
 assert.ok(Math.abs(pose.rollRad)<=bound+1e-12);
 assert.ok(Math.abs(pose.pitchRad)<=bound+1e-12);
 assert.ok(Math.hypot(pose.slopeX,pose.slopeY)>1);
 assert.throws(()=>waveModelPose(wave,0,"follow-slope",0,0,{maxTiltDeg:60}),/limit/);
});
