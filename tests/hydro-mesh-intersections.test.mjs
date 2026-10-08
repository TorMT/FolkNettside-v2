import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {validateHydroGeometry,validateHydroModel} from "../src/model/hull-surface-validator.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {inspectMeshIntersections,trianglesIntersect3D} from "../src/model/mesh-intersections.js";
const close=(a,b)=>Math.abs(a-b)<1e-8;
function combined(...objects){
  const positions=[],indices=[];
  for(const mesh of objects){
    const offset=positions.length/3;
    positions.push(...mesh.positions);
    indices.push(...mesh.indices.map(i=>i+offset));
  }
  return {positions,indices};
}
const doc=geometry=>({sourceType:"local-import",unitScaleToMeters:1,components:[
  {id:"mesh",name:"Imported surface",geometry,metadata:{hydro:true}}
]});
test("baseline watertight box remains accepted after BVH collision screen",()=>{
  const preflight=validateHydroGeometry(boxMesh({L:10,B:4,H:2}));
  assert.equal(preflight.passed,true,JSON.stringify(preflight.errors));
  assert.equal(preflight.metrics.selfIntersections,0);
  assert.equal(preflight.metrics.intersectionScanExhaustive,true);
});
test("two interpenetrating closed boxes masquerading as one part are rejected",()=>{
  const a=boxMesh({L:4,B:4,H:2});
  const b=boxMesh({L:4,B:4,H:2,origin:[1,0,0]});
  const mesh=combined(a,b);
  const v=validateHydroGeometry(mesh);
  assert.equal(v.metrics.boundaryEdges,0);
  assert.equal(v.metrics.nonManifoldEdges,0);
  assert.equal(v.metrics.windingConflicts,0);
  assert.equal(v.passed,false);
  assert.ok(v.metrics.selfIntersections>0,JSON.stringify(v));
  assert.match(v.errors.join(" "),/intersecting non-adjacent triangle/);
  const model=doc(mesh);
  assert.equal(validateHydroModel(model).passed,false);
  for(const [type,payload] of [["analyze",{waterline:1}],
    ["curve",{minWaterline:.2,maxWaterline:1.8,samples:5}],
    ["solve",{targetVolume:12,minWaterline:0,maxWaterline:2}],
    ["gz",{targetVolume:12,kg:.5}]])
    assert.throws(()=>executeHydroRequest(model,type,payload),/Hydro preflight blocked/);
});
test("two disjoint closed pontoons in one imported component pass triangle screen",()=>{
  const a=boxMesh({L:5,B:2,H:2,origin:[0,-3,0]});
  const b=boxMesh({L:5,B:2,H:2,origin:[0,3,0]});
  const m=combined(a,b);
  const v=validateHydroGeometry(m);
  assert.equal(v.passed,true,JSON.stringify(v.errors));
  assert.equal(v.metrics.selfIntersections,0);
  const hydro=executeHydroRequest(doc(m),"analyze",{waterline:1});
  assert.ok(close(hydro.volume,20));
});
test("coplanar interior overlap is found without relying on triangle winding",()=>{
  const a=[[0,0,0],[3,0,0],[0,3,0]];
  const b=[[.4,.4,0],[1.2,.4,0],[.4,1.2,0]];
  const c=[[4,0,0],[5,0,0],[4,1,0]];
  assert.equal(trianglesIntersect3D(a,b),true);
  assert.equal(trianglesIntersect3D(a,c),false);
});
test("transverse noncoplanar triangle intersections are detected",()=>{
  const a=[[-1,-1,0],[1,-1,0],[0,2,0]];
  const b=[[0,0,-1],[0,0,1],[0,2,0.5]];
  assert.equal(trianglesIntersect3D(a,b),true);
});
test("bounded intersection comparison budget fails closed",()=>{
  const geometry=combined(
    boxMesh({L:4,B:4,H:2}),
    boxMesh({L:4,B:4,H:2,origin:[1,0,0]})
  );
  const vertices=Array.from({length:geometry.positions.length/3},(_,i)=>
    geometry.positions.slice(i*3,i*3+3));
  const ids=vertices.map((_,i)=>i);
  const result=inspectMeshIntersections(vertices,geometry.indices,ids,{maxCandidatePairs:0});
  assert.equal(result.exhaustive,false);
  assert.equal(result.candidatePairs,1);
});

test("closed nested shells in one component are blocked even without triangle collisions",()=>{
  const mesh=combined(
    boxMesh({L:10,B:6,H:4}),
    boxMesh({L:1,B:1,H:1,origin:[0,0,2]})
  );
  const gate=validateHydroGeometry(mesh);
  assert.equal(gate.metrics.boundaryEdges,0);
  assert.equal(gate.metrics.windingConflicts,0);
  assert.equal(gate.metrics.selfIntersections,0);
  assert.equal(gate.metrics.edgeConnectedShells,2);
  assert.equal(gate.metrics.ambiguousShellPairs,1);
  assert.equal(gate.passed,false);
  assert.match(gate.errors.join(" "),/nested disconnected shell/);
  assert.throws(()=>executeHydroRequest(doc(mesh),"analyze",{waterline:2}),/preflight blocked/);
});
test("disjoint shells inside a single component remain valid",()=>{
  const mesh=combined(
    boxMesh({L:4,B:2,H:2,origin:[-8,0,0]}),
    boxMesh({L:4,B:2,H:2,origin:[8,0,0]})
  );
  const gate=validateHydroGeometry(mesh);
  assert.equal(gate.passed,true,JSON.stringify(gate.errors));
  assert.equal(gate.metrics.edgeConnectedShells,2);
  assert.equal(gate.metrics.ambiguousShellPairs,0);
});
