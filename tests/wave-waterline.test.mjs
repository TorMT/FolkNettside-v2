import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {modelWaterlineContours} from "../src/model/waterline-preview.js";
import {waveNumber,normaliseWaveCase,waveElevation,sampleWave,
  normalizeWaveObservations,waveObservationsCSV} from "../src/model/wave-core.js";
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`Expected ${a} ≈ ${b}`);
test("actual still-water contour matches 10 × 4 m box (not a screen-space overlay)",()=>{
 const mesh=boxMesh({L:10,B:4,H:3});
 const result=modelWaterlineContours([mesh],1);
 assert.equal(result.status,"ok");
 assert.equal(result.loops.length,1);
 const loop=result.loops[0];
 near(Math.max(...loop.map(p=>p[0]))-Math.min(...loop.map(p=>p[0])),10);
 near(Math.max(...loop.map(p=>p[1]))-Math.min(...loop.map(p=>p[1])),4);
 near(Math.max(...loop.map(p=>p[0]))*0+Math.min(...loop.map(p=>p[1])), -2);
 const above=modelWaterlineContours([mesh],5);
 assert.deepEqual(above.loops,[]);
 assert.equal(modelWaterlineContours([mesh],1,{maxTriangles:2}).status,"too-large");
});
test("linear deep-water wavelength, phase velocity and wave elevation follow dispersion",()=>{
 const wave=normaliseWaveCase({heightM:2,periodS:5,headingDeg:0});
 near(wave.waveNumber,(2*Math.PI/5)**2/9.80665,1e-12);
 near(wave.wavelengthM,9.80665*25/(2*Math.PI),1e-9);
 near(waveElevation(wave,0,0,0),1);
 near(waveElevation(wave,wave.wavelengthM/2,0,0),-1);
 near(waveElevation(wave,0,0,5),1);
 const samples=sampleWave(wave,{durationS:5,stepS:.5});
 assert.equal(samples.length,11);
 assert.match(waveObservationsCSV(samples),/^time_s,eta_m/);
});
test("finite water depth has shorter wave and valid linear dispersion",()=>{
 const deep=normaliseWaveCase({heightM:.5,periodS:10});
 const shallow=normaliseWaveCase({heightM:.5,periodS:10,waterDepthM:2});
 assert.ok(shallow.wavelengthM<deep.wavelengthM);
 near(9.80665*shallow.waveNumber*Math.tanh(2*shallow.waveNumber),
   shallow.omega**2,1e-10);
});
test("wave observations import must have monotonic time and valid columns",()=>{
 const rows=[["time_s","eta_m"],["0","0.1"],["0.5","-0.2"],["1","0.0"]];
 const entries=normalizeWaveObservations(rows);
 assert.equal(entries[1].elevationM,-.2);
 assert.equal(entries.length,3);
 assert.throws(()=>normalizeWaveObservations([rows[0],["1","0"],["0","1"]]),/increase strictly/);
 assert.throws(()=>normaliseWaveCase({heightM:1,periodS:0}),/period must be positive/i);
 assert.throws(()=>sampleWave(normaliseWaveCase(),{durationS:10000,stepS:.01}),/10001/);
});
