import test from "node:test";
import assert from "node:assert/strict";
import {ittc1957,resistanceCurve,knots} from "../src/resistance/ittc1957.js";

const near=(actual,expected,tol)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);

test("ITTC-1957 reference fixture",()=>{
  const r=ittc1957({
    length:50,
    wettedSurface:500,
    speed:knots(10),
    density:1025,
    kinematicViscosity:1.19e-6
  });
  near(r.reynolds,216152941.1764706,1e-3);
  near(r.cf,0.0018689633037123215,1e-15);
  near(r.frictionResistance,12674.792584708117,1e-6);
  near(r.froude,0.2323232991919726,1e-12);
  near(r.effectivePower,65204.70996447583,1e-6);
});

test("zero speed gives zero friction and power",()=>{
  const r=ittc1957({length:50,wettedSurface:500,speed:0});
  assert.equal(r.frictionResistance,0);
  assert.equal(r.effectivePower,0);
  assert.equal(r.cf,0);
});

test("resistance curve increases with speed for fixed geometry",()=>{
  const curve=resistanceCurve({length:50,wettedSurface:500,density:1025,kinematicViscosity:1.19e-6},{minSpeed:knots(2),maxSpeed:knots(12),samples:6});
  assert.equal(curve.length,6);
  for(let i=1;i<curve.length;i++)assert.ok(curve[i].frictionResistance>curve[i-1].frictionResistance);
});
