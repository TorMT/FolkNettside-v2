import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normaliseWaveCase} from "../src/model/wave-core.js";
import {RAO_DOFS,parseMotionRAOCSV,interpolateMotionRAO,
  motionFromRAO} from "../src/model/motion-rao.js";
const near=(a,b,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<tol,`${a} vs ${b}`);
const header="heading_deg,omega_rad_s,dof,amplitude,phase_deg";
function sample(rows){
 return header+"\n"+rows.flatMap(([heading,omega,amps,phases])=>
   RAO_DOFS.map((dof,i)=>[heading,omega,dof,amps[i],phases[i]].join(","))).join("\n");
}
const sampleTable=()=>parseMotionRAOCSV(readFileSync(
  new URL("../examples/rao/synthetic_six_dof_rao.csv",import.meta.url),"utf8"),
  {name:"Synthetic example"});
test("strict RAO import has all six DOF at each heading/frequency",()=>{
 const table=sampleTable();
 assert.equal(table.kind,"imported-linear-motion-rao");
 assert.equal(table.rows.length,12);
 assert.deepEqual(table.headings,[0,90,180,270]);
 assert.deepEqual(Object.keys(table.rows[0].components),RAO_DOFS);
 assert.match(table.conventions,/rotational rad\/m/);
});
test("complex phase reconstruction returns actual 6DoF in metres and radians",()=>{
 const omega=2*Math.PI/6;
 const values=[.3,.2,1.4,.1,.15,.2],phases=[0,90,180,-90,45,30];
 const table=parseMotionRAOCSV(sample([[0,omega,values,phases]]));
 const interp=interpolateMotionRAO(table,omega,0);
 const wave=normaliseWaveCase({heightM:2,periodS:6,headingDeg:0});
 const pose=motionFromRAO(interp,wave,0);
 near(pose.surgeM,.3);near(pose.swayM,0);near(pose.heaveM,-1.4);
 near(pose.rollRad,0);near(pose.pitchRad,.15*Math.cos(Math.PI/4));
 near(pose.yawRad,.2*Math.cos(Math.PI/6));
 const quarter=motionFromRAO(interp,wave,1.5);
 near(quarter.surgeM,0);near(quarter.swayM,.2);
 near(quarter.heaveM,0);
 near(quarter.rollRad,-.1);
});
test("interpolate complex coefficients, not naive wrapped phase angles",()=>{
 const table=parseMotionRAOCSV(sample([
   [0,1,[0,0,1,0,0,0],[0,0,179,0,0,0]],
   [0,2,[0,0,1,0,0,0],[0,0,-179,0,0,0]]
 ]));
 const mid=interpolateMotionRAO(table,1.5,0).components.heave;
 assert.ok(mid.re<-.99,"phase wrap should remain near 180 degrees");
 assert.ok(Math.abs(mid.im)<1e-12);
});
test("no unvalidated extrapolation or imaginary heading interpolation",()=>{
 const table=sampleTable();
 assert.throws(()=>interpolateMotionRAO(table,.4,0),/outside RAO data/i);
 assert.throws(()=>interpolateMotionRAO(table,20,0),/outside RAO data/i);
 assert.throws(()=>interpolateMotionRAO(table,2*Math.PI/6,45),/No RAO data/i);
 const interp=interpolateMotionRAO(table,2*Math.PI/6,0);
 assert.throws(()=>motionFromRAO(interp,
   normaliseWaveCase({periodS:6,headingDeg:90}),0),/mismatch/);
});
test("reject missing DOF rows, duplicates, negative amplitudes and invalid headers",()=>{
 const omega=2*Math.PI/6;
 const input=sample([[0,omega,[1,1,1,1,1,1],[0,0,0,0,0,0]]]);
 assert.throws(()=>parseMotionRAOCSV(input.replace(/\n[^\n]*,yaw,1,0/,"")),/missing yaw/);
 assert.throws(()=>parseMotionRAOCSV(input+"\n0,"+omega+",heave,1,0"),/Duplicate/);
 assert.throws(()=>parseMotionRAOCSV(input.replace(",heave,1,0",",heave,-1,0")),/amplitude/);
 assert.throws(()=>parseMotionRAOCSV(input.replace(header,"freq_hz,dof,amp,phase")),/columns/);
 assert.throws(()=>parseMotionRAOCSV(input.replaceAll(","+omega+",",",0,")),/omega/);
});
test("RAO response uses actual wave phase at reference location",()=>{
 const omega=2*Math.PI/6;
 const table=parseMotionRAOCSV(sample([[0,omega,[0,0,1,0,0,0],[0,0,0,0,0,0]]]));
 const wave=normaliseWaveCase({heightM:4,periodS:6,headingDeg:0});
 const rao=interpolateMotionRAO(table,omega,0);
 near(motionFromRAO(rao,wave,0,0,0).heaveM,2);
 near(motionFromRAO(rao,wave,0,wave.wavelengthM/2,0).heaveM,-2);
 near(motionFromRAO(rao,wave,3,0,0).heaveM,-2);
});
