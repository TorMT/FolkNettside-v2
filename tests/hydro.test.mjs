import test from "node:test";
import assert from "node:assert/strict";
import {analyzeHydrostatics,analyzeModelDocument,analyzePreparedHydro,hydroCurve,prepareHydroModel,solveWaterlineForVolume} from "../src/hydro/hydrostatics.js";
import {boxMesh,reverseWinding,wedgePrismMesh} from "../src/hydro/fixtures.js";
import {createHydroInclude} from "../src/hydro/hydro-selection.js";

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


test("ModelDocument applies source units and component transform",()=>{
  const geometry=boxMesh({L:10000,B:3000,H:2000});
  const transform=[1,0,0,0, 0,1,0,0, 0,0,1,0, 2000,0,0,1];
  const model={
    unitScaleToMeters:.001,
    components:[{id:"hull",name:"Hull",transform,geometry}]
  };
  const r=analyzeModelDocument(model,1.2);
  near(r.volume,36,1e-7);
  near(r.centerOfBuoyancy[0],2,1e-8);
  near(r.centerOfBuoyancy[2],.6,1e-8);
  near(r.waterplane.area,30,1e-7);
});

test("ModelDocument aggregates multiple translated waterplanes",()=>{
  const transform=(x)=>[1,0,0,0, 0,1,0,0, 0,0,1,0, x,0,0,1];
  const model={
    unitScaleToMeters:1,
    components:[
      {id:"left",name:"Left",transform:transform(-3),geometry:boxMesh({L:2,B:2,H:2})},
      {id:"right",name:"Right",transform:transform(3),geometry:boxMesh({L:2,B:2,H:2})}
    ]
  };
  const r=analyzeModelDocument(model,1);
  near(r.volume,8,1e-8);
  near(r.centerOfBuoyancy[0],0,1e-8);
  near(r.waterplane.area,8,1e-8);
  near(r.waterplane.centroid[0],0,1e-8);
});


test("hydro curve follows analytic box volume",()=>{
  const model={unitScaleToMeters:1,components:[{id:"hull",name:"Hull",geometry:boxMesh({L:10,B:3,H:2}),metadata:{hydro:true}}]};
  const curve=hydroCurve(model,{minWaterline:0,maxWaterline:2,samples:5,include:c=>c.metadata.hydro});
  assert.equal(curve.length,5);
  near(curve[0].volume,0,1e-8);
  near(curve[1].volume,15,1e-7);
  near(curve[2].volume,30,1e-7);
  near(curve[4].volume,60,1e-7);
});

test("target displacement volume solves analytic draft",()=>{
  const model={unitScaleToMeters:1,components:[{id:"hull",name:"Hull",geometry:boxMesh({L:10,B:3,H:2}),metadata:{hydro:true}}]};
  const solved=solveWaterlineForVolume(model,36,{minWaterline:0,maxWaterline:2,tolerance:1e-9,include:c=>c.metadata.hydro});
  near(solved.waterline,1.2,1e-8);
  near(solved.result.volume,36,1e-8);
});


test("explicit hydro flags exclude non-hydro geometry",()=>{
  const hull=boxMesh({L:10,B:3,H:2});
  const thruster=boxMesh({L:2,B:2,H:2,origin:[0,0,0]});
  const model={
    unitScaleToMeters:1,
    components:[
      {id:"hull",name:"Hull",geometry:hull,metadata:{hydro:true}},
      {id:"thruster",name:"Thruster",geometry:thruster,metadata:{hydro:false}}
    ]
  };
  const include=createHydroInclude(model);
  const r=analyzeModelDocument(model,1.2,{include});
  near(r.volume,36,1e-7);
  assert.equal(r.components.length,1);
  assert.equal(r.components[0].componentId,"hull");
});

test("hydro selection defaults to all geometry when no explicit flags exist",()=>{
  const model={
    unitScaleToMeters:1,
    components:[
      {id:"a",geometry:boxMesh({L:2,B:2,H:2}),metadata:{}},
      {id:"b",geometry:boxMesh({L:2,B:2,H:2,origin:[4,0,0]}),metadata:{}}
    ]
  };
  const r=analyzeModelDocument(model,1,{include:createHydroInclude(model)});
  near(r.volume,8,1e-8);
  assert.equal(r.components.length,2);
});


test("prepared hydro model is numerically identical to direct ModelDocument analysis",()=>{
  const model={
    unitScaleToMeters:.001,
    components:[
      {
        id:"hull",
        name:"Hull",
        transform:[1,0,0,0, 0,1,0,0, 0,0,1,0, 1500,-500,0,1],
        geometry:boxMesh({L:10000,B:3000,H:2000}),
        metadata:{hydro:true}
      }
    ]
  };
  const include=createHydroInclude(model);
  const direct=analyzeModelDocument(model,1.1,{include});
  const prepared=prepareHydroModel(model,{include});
  const cached=analyzePreparedHydro(prepared,1.1);
  near(cached.volume,direct.volume,1e-10);
  near(cached.centerOfBuoyancy[0],direct.centerOfBuoyancy[0],1e-10);
  near(cached.centerOfBuoyancy[1],direct.centerOfBuoyancy[1],1e-10);
  near(cached.centerOfBuoyancy[2],direct.centerOfBuoyancy[2],1e-10);
  near(cached.waterplane.area,direct.waterplane.area,1e-10);
  near(cached.waterplane.ixx,direct.waterplane.ixx,1e-10);
  near(cached.waterplane.iyy,direct.waterplane.iyy,1e-10);
});
