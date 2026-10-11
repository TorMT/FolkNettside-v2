import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,wedgePrismMesh,reverseWinding} from "../src/hydro/fixtures.js";
import {analyzeModelDocument,prepareHydroModel} from "../src/hydro/hydrostatics.js";
import {createHydroInclude} from "../src/hydro/hydro-selection.js";
import {clipPressureTriangle,pressureOnTriangle,
  integratePreparedHullPressure,integrateModelHullPressure} from "../src/hydro/pressure-integration.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";

const near=(actual,expected,tol=1e-7)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,
  "expected "+actual+" ≈ "+expected+" ± "+tol);
const model=(geometry,transform=null,scale=1)=>({
 unitScaleToMeters:scale,
 components:[{id:"hull",name:"External hull",geometry,transform,metadata:{hydro:true}}]
});

test("exact linear pressure on horizontal bottom: 1m2 at 2m depth has positive buoyant 19.6133 kN",()=>{
 const t=[[0,0,0],[0,1,0],[2,0,0]]; // outward/down bottom, projected area 1 m2
 const r=pressureOnTriangle(t,{waterline:2,densityKgM3:1000});
 near(r.forceN[2],19613.3,1e-8);
 near(r.momentNm[0],r.forceN[2]/3,1e-8);
 near(r.momentNm[1],-r.forceN[2]*2/3,1e-8);
 near(r.centerOfPressure[0],2/3);
 near(r.centerOfPressure[1],1/3);
});

test("partial submergence triangulation clips exactly at still water without above-water pressure",()=>{
 const tri=[[0,0,-1],[2,0,1],[0,2,-1]];
 const poly=clipPressureTriangle(tri,0);
 assert.equal(poly.length,4);
 assert.ok(poly.every(v=>v[2]<=1e-12));
 const r=pressureOnTriangle([poly[0],poly[1],poly[2]],{waterline:0,densityKgM3:1025});
 assert.ok(r.forceN.every(Number.isFinite));
 assert.ok(r.maxPressurePa<=1025*9.80665*1+1e-6);
});

test("box barge wetted-pressure result equals Archimedes volume, CB moment and zero horizontal force",()=>{
 const m=model(boxMesh({L:10,B:4,H:3}));
 const prepared=prepareHydroModel(m,{include:createHydroInclude(m)});
 for(const draft of [0.1,.25,1,1.5,2.99,3,3.5]){
   const p=integratePreparedHullPressure(prepared,{waterline:draft,densityKgM3:1025});
   const v=10*4*Math.min(draft,3);
   near(p.forceN[2],v*1025*9.80665,1e-6);
   near(p.forceN[0],0,1e-7);near(p.forceN[1],0,1e-7);
   p.momentNm.forEach(v=>near(v,0,1e-6));
   assert.equal(p.crossCheck.passed,true,JSON.stringify(p.crossCheck));
   near(p.strips.reduce((sum,x)=>sum+x.forceZKN,0),p.forceN[2]/1000,1e-8);
 }
});

test("translated/offset box pressure moment equals CB cross buoyancy and follows scaled model transforms",()=>{
 const origin=[3,1,2],geometry=boxMesh({L:8,B:2,H:3,origin});
 const m=model(geometry);
 const p=integrateModelHullPressure(m,{waterline:3,densityKgM3:1000});
 const buoyancy=8*2*1*1000*9.80665;
 near(p.forceN[2],buoyancy,1e-6);
 near(p.momentNm[0],origin[1]*buoyancy,1e-6);
 near(p.momentNm[1],-origin[0]*buoyancy,1e-6);
 assert.equal(p.crossCheck.passed,true);
 const mm=model(boxMesh({L:8000,B:2000,H:3000,origin:[0,0,0]}),
  [1,0,0,0,0,1,0,0,0,0,1,0,3000,1000,2000,1],.001);
 const scaled=integrateModelHullPressure(mm,{waterline:3,densityKgM3:1000});
 near(scaled.forceN[2],p.forceN[2],1e-6);
 near(scaled.momentNm[0],p.momentNm[0],1e-6);
 near(scaled.momentNm[1],p.momentNm[1],1e-6);
 assert.equal(scaled.crossCheck.passed,true);
});

test("wedge prism pressure integrates force and moment against independent clipped-volume solver",()=>{
 const m=model(wedgePrismMesh({L:8,B:2,H0:.5,H1:2}));
 const hydro=analyzeModelDocument(m,.9,{include:createHydroInclude(m)});
 const p=integrateModelHullPressure(m,{waterline:.9,densityKgM3:1025});
 assert.ok(hydro.centerOfBuoyancy[0]<0);
 near(p.forceN[2],hydro.volume*1025*9.80665,1e-6);
 near(p.momentNm[1],-hydro.centerOfBuoyancy[0]*p.forceN[2],1e-6);
 assert.equal(p.crossCheck.passed,true,JSON.stringify(p.crossCheck));
});

test("explicit Hydro selection excludes unrelated equipment and pressure surface",()=>{
 const m=model(boxMesh({L:10,B:4,H:3}));
 m.components.push({id:"thruster",name:"Interior machinery",
   geometry:boxMesh({L:1,B:1,H:1}),metadata:{hydro:false}});
 const p=integrateModelHullPressure(m,{waterline:1,densityKgM3:1000,include:createHydroInclude(m)});
 near(p.forceN[2],40*1000*9.80665,1e-6);
 assert.equal(p.components.length,1);
 assert.equal(p.components[0].componentId,"hull");
});

test("pressure request enforces hydro preflight and bounded triangle budgets",()=>{
 const m=model(boxMesh({L:10,B:3,H:2}));
 const res=executeHydroRequest(m,"pressure",{waterline:1,densityKgM3:1000});
 assert.equal(res.crossCheck.passed,true);
 const broken=model(reverseWinding(boxMesh({L:10,B:3,H:2})));
 assert.throws(()=>executeHydroRequest(broken,"pressure",{waterline:1,densityKgM3:1000}),/Hydro preflight blocked/);
 assert.throws(()=>executeHydroRequest(m,"pressure",{waterline:1,maxTriangles:1}),/triangle budget/);
 assert.throws(()=>integrateModelHullPressure(m,{waterline:1,densityKgM3:0}),/Invalid pressure integration settings/);
});
