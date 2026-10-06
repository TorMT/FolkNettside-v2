import test from "node:test";
import assert from "node:assert/strict";
import {actuatorDisk,actuatorDiskCurve} from "../src/propulsion/actuator-disk.js";

const near=(actual,expected,tol)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);

test("actuator disk reference fixture",()=>{
  const r=actuatorDisk({thrust:20000,diameter:1.5,inflowSpeed:3,density:1025});
  near(r.area,1.7671458676442586,1e-12);
  near(r.diskLoading,11317.684842090335,1e-9);
  near(r.inducedVelocity,1.2876193919167673,1e-12);
  near(r.diskVelocity,4.287619391916767,1e-12);
  near(r.farWakeVelocity,5.575238783833535,1e-12);
  near(r.idealPower,85752.38783833534,1e-8);
  near(r.idealEfficiency,0.6996889709137311,1e-12);
});

test("static thrust has finite induced velocity and no propulsive efficiency ratio",()=>{
  const r=actuatorDisk({thrust:10000,diameter:1,density:1025,inflowSpeed:0});
  assert.ok(r.inducedVelocity>0);
  assert.equal(r.idealEfficiency,null);
  near(r.idealPower,10000*r.inducedVelocity,1e-8);
});

test("zero thrust preserves inflow",()=>{
  const r=actuatorDisk({thrust:0,diameter:1.5,inflowSpeed:4,density:1025});
  assert.equal(r.inducedVelocity,0);
  assert.equal(r.diskVelocity,4);
  assert.equal(r.farWakeVelocity,4);
  assert.equal(r.idealPower,0);
});

test("actuator disk curve grows monotonically in induced velocity",()=>{
  const curve=actuatorDiskCurve({diameter:1.5,inflowSpeed:3,density:1025},{maxThrust:30000,samples:7});
  for(let i=1;i<curve.length;i++)assert.ok(curve[i].inducedVelocity>=curve[i-1].inducedVelocity);
});
