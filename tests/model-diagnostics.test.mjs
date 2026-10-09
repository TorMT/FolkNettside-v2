import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {analyzeGeometryDiagnostics,analyzeModelDiagnostics} from "../src/model/mesh-diagnostics.js";

test("closed box is watertight after positional vertex welding",()=>{
  const result=analyzeGeometryDiagnostics(boxMesh({L:10,B:3,H:2}));
  assert.equal(result.triangleCount,12);
  assert.equal(result.boundaryEdges,0);
  assert.equal(result.nonManifoldEdges,0);
  assert.equal(result.degenerateTriangles,0);
  assert.equal(result.watertight,true);
  assert.deepEqual(result.bounds.size,[10,3,2]);
});

test("open mesh reports boundary edges",()=>{
  const geometry={
    positions:[0,0,0, 1,0,0, 1,1,0, 0,1,0],
    indices:[0,1,2, 0,2,3]
  };
  const result=analyzeGeometryDiagnostics(geometry);
  assert.equal(result.watertight,false);
  assert.equal(result.boundaryEdges,4);
  assert.equal(result.nonManifoldEdges,0);
});

test("three triangles sharing an edge reports non-manifold topology",()=>{
  const geometry={
    positions:[
      0,0,0, 1,0,0, 0,1,0,
      0,0,0, 1,0,0, 0,-1,0,
      0,0,0, 1,0,0, 0,0,1
    ],
    indices:[0,1,2, 3,4,5, 6,7,8]
  };
  const result=analyzeGeometryDiagnostics(geometry);
  assert.equal(result.watertight,false);
  assert.ok(result.nonManifoldEdges>=1);
});

test("model diagnostics use world transforms and source units",()=>{
  const geometry=boxMesh({L:1000,B:2000,H:3000});
  const model={
    unitScaleToMeters:.001,
    components:[{
      id:"box",name:"Box",type:"hull",geometry,
      transform:[1,0,0,0, 0,1,0,0, 0,0,1,0, 5000,0,0,1]
    }]
  };
  const result=analyzeModelDiagnostics(model);
  assert.equal(result.watertight,true);
  assert.deepEqual(result.bounds.size,[1,2,3]);
  assert.deepEqual(result.bounds.min,[4.5,-1,0]);
  assert.deepEqual(result.bounds.max,[5.5,1,3]);
});


test("diagnostics never certify degenerate or nonfinite hull meshes as watertight",()=>{
  const invalid=boxMesh({L:10,B:3,H:2});
  invalid.indices.push(0,0,0);
  const a=analyzeGeometryDiagnostics(invalid);
  assert.ok(a.degenerateTriangles>0);
  assert.equal(a.watertight,false);
  const other=boxMesh({L:10,B:3,H:2});
  other.positions[0]=NaN;
  const b=analyzeGeometryDiagnostics(other);
  assert.ok(b.invalidVertices>0);
  assert.equal(b.watertight,false);
});

test("model diagnostic cache respects the requested welding tolerance",()=>{
  const model={unitScaleToMeters:1,components:[{
    id:"test-hull",name:"Hull",geometry:boxMesh({L:10,B:3,H:2})
  }]};
  const fine=analyzeModelDiagnostics(model,{tolerance:1e-8});
  assert.equal(fine.watertight,true);
  const broad=analyzeModelDiagnostics(model,{tolerance:100});
  assert.equal(broad.watertight,false);
  const fineAgain=analyzeModelDiagnostics(model,{tolerance:1e-8});
  assert.equal(fineAgain.watertight,true);
  assert.notEqual(fine,broad);
});

test("empty model yields diagnostics instead of WeakMap key failure",()=>{
  const result=analyzeModelDiagnostics(null);
  assert.equal(result.watertight,false);
  assert.equal(result.geometryComponents,0);
});
