import test from "node:test";
import assert from "node:assert/strict";
import {analyzeHydrostatics} from "../src/hydro/hydrostatics.js";
import {boxMesh,reverseWinding,wedgePrismMesh} from "../src/hydro/fixtures.js";

const near=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);

test("rectangular barge analytic hydrostatics",()=>{
  const L=10,B=3,T=1.2;
  const r=analyzeHydrostatics(boxMesh({L,B,H:2}),T);
  near(r.volume,L*B*T,1e-7);
  near(r.centerOfBuoyancy[0],0,1e-8);
  near(r.centerOfBuoyancy[1],0,1e-8);
  near(r.centerOfBuoyancy[2],T/2,1e-8);
  near(r.waterplane.area,L*B,1e-7);
  near(r.waterplane.ixx,L*B**3/12,1e-7);
  near(r.waterplane.iyy,B*L**3/12,1e-7);
});

test("fully reversed winding preserves positive volume and centroid",()=>{
  const mesh=boxMesh({L:6,B:2,H:3});
  const a=analyzeHydrostatics(mesh,1.5);
  const b=analyzeHydrostatics(reverseWinding(mesh),1.5);
  near(a.volume,b.volume);
  near(a.centerOfBuoyancy[2],b.centerOfBuoyancy[2]);
});

test("multiple independent boxes can be summed exactly",()=>{
  const left=analyzeHydrostatics(boxMesh({L:4,B:2,H:2,origin:[-3,0,0]}),1);
  const right=analyzeHydrostatics(boxMesh({L:2,B:2,H:2,origin:[4,0,0]}),1);
  near(left.volume,8);
  near(right.volume,4);
  near((left.volume*left.centerOfBuoyancy[0]+right.volume*right.centerOfBuoyancy[0])/(left.volume+right.volume),-2/3);
});

test("wedge prism full volume matches trapezoidal analytic volume",()=>{
  const L=8,B=2,H0=.5,H1=2;
  const r=analyzeHydrostatics(wedgePrismMesh({L,B,H0,H1}),3);
  near(r.volume,L*B*(H0+H1)/2,1e-7);
});
