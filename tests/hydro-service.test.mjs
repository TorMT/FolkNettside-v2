import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";

const model={
  unitScaleToMeters:1,
  components:[
    {id:"hull",name:"Hull",geometry:boxMesh({L:10,B:3,H:2}),metadata:{hydro:true}},
    {id:"excluded",name:"Excluded",geometry:boxMesh({L:2,B:2,H:2}),metadata:{hydro:false}}
  ]
};

test("hydro request dispatcher applies component selection to analyze curve and solve",()=>{
  const analysis=executeHydroRequest(model,"analyze",{waterline:1});
  assert.equal(analysis.components.length,1);
  assert.ok(Math.abs(analysis.volume-30)<1e-8);

  const curve=executeHydroRequest(model,"curve",{minWaterline:0,maxWaterline:2,samples:3});
  assert.equal(curve.length,3);
  assert.ok(Math.abs(curve[1].volume-30)<1e-8);

  const solved=executeHydroRequest(model,"solve",{
    targetVolume:36,minWaterline:0,maxWaterline:2,tolerance:1e-9,maxIterations:80
  });
  assert.ok(Math.abs(solved.waterline-1.2)<1e-8);
});

test("hydro request dispatcher executes GZ without browser Worker globals",()=>{
  const curve=executeHydroRequest(model,"gz",{
    targetVolume:30,kg:.5,density:1025,minHeel:-5,maxHeel:5,step:5,tolerance:1e-9,maxIterations:80
  });
  assert.equal(curve.length,3);
  assert.ok(Math.abs(curve[1].gz)<1e-12);
});

test("unknown hydro request fails explicitly",()=>{
  assert.throws(()=>executeHydroRequest(model,"missing",{}),/Unknown hydro request/);
});
