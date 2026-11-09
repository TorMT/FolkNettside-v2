import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {validateHydroGeometry,validateHydroModel} from "../src/model/hull-surface-validator.js";
import {previewComponentMeshRepair,previewHydroMeshRepair,repairedHullSTL} from "../src/model/mesh-repair.js";

// Closed twelve-triangle test solid with one locally bad diagonal. The single
// self-crossing edge is recoverable without relocating any vertex.
const fixable=()=>({
  positions:[-1,-1,-1,1,-1,-1,1,1,-1,-1,1,-1,
    -1,-1,1,1,-1,1,4.504502586089075,-0.00007440894842147827,
    -1.022739197127521,-1,1,1],
  indices:[0,2,1,0,3,2,4,5,6,4,6,7,0,4,7,0,7,3,
    1,2,6,1,6,5,0,1,5,0,5,4,3,7,6,3,6,2]
});
const doc=geometry=>({format:"3MF",sourceType:"local-import",unit:"meter",unitScaleToMeters:1,
  components:[{id:"hull",name:"Hull",geometry,metadata:{hydro:true}}]});

test("repair preview flips a crossing diagonal with no vertex movement",()=>{
  const source=fixable(),original=structuredClone(source);
  const before=validateHydroGeometry(source);
  assert.equal(before.passed,false);
  assert.ok(before.metrics.selfIntersections>0);
  const preview=previewComponentMeshRepair(source);
  assert.equal(preview.status,"repaired",JSON.stringify(preview));
  assert.equal(preview.flips,1);
  assert.equal(preview.after.passed,true);
  assert.equal(preview.after.metrics.selfIntersections,0);
  assert.ok(preview.relativeDelta<1e-5);
  assert.deepEqual(source,original,"Source must remain untouched");
  assert.deepEqual(preview.geometry.positions,source.positions);
});

test("model repair is opt-in and preserves selected hull metadata",()=>{
  const original=doc(fixable());
  assert.equal(previewHydroMeshRepair(original,{selectedIds:[]}).status,"unsupported");
  const preview=previewHydroMeshRepair(original,{selectedIds:["hull"]});
  assert.equal(preview.status,"ready");
  assert.equal(validateHydroModel(preview.model).passed,true);
  assert.equal(validateHydroModel(original).passed,false);
  assert.equal(preview.model.components[0].metadata.hydro,true);
  assert.equal(preview.model.components[0].metadata.meshRepair.flips,1);
});

test("valid hull is left unchanged",()=>{
  const geometry=boxMesh({L:10,B:4,H:2});
  const result=previewComponentMeshRepair(geometry);
  assert.equal(result.status,"already-valid");
  assert.equal(result.geometry,geometry);
  assert.equal(result.flips,0);
});

test("invalid open or malformed hull is never auto patched",()=>{
  const mesh=boxMesh({L:10,B:4,H:2});
  mesh.indices=mesh.indices.slice(0,-3);
  assert.equal(previewComponentMeshRepair(mesh).status,"unsupported");
});

test("true interpenetrating closed solids are not treated as triangulation noise",()=>{
  const first=boxMesh({L:4,B:4,H:2});
  const second=boxMesh({L:4,B:4,H:2,origin:[1,0,0]});
  const geometry={
    positions:[...first.positions,...second.positions],
    indices:[...first.indices,...second.indices.map(i=>i+first.positions.length/3)]
  };
  assert.equal(validateHydroGeometry(geometry).passed,false);
  const result=previewComponentMeshRepair(geometry,{maxFlips:4});
  assert.equal(result.status,"unsupported");
});

test("STL export is in world-space metres, not source 3MF units",()=>{
  const geometry={positions:[0,0,0,1000,0,0,0,1000,0],indices:[0,1,2]};
  const model={unitScaleToMeters:.001,components:[{id:"h",geometry}]};
  const stl=repairedHullSTL(model,["h"]);
  assert.match(stl,/solid repaired_hull_meters/);
  assert.match(stl,/vertex 1 0 0/);
  assert.match(stl,/vertex 0 1 0/);
});

// --- Uniformly inverted (inside-out) closed hulls ---------------------------
import {reverseWinding} from "../src/hydro/fixtures.js";
import {parseSTL} from "../src/model/parsers/stl.js";

test("an inside-out closed hull is repaired by reversing every triangle, vertices untouched",()=>{
  const source=reverseWinding(boxMesh({L:10,B:3,H:2})),original=structuredClone(source);
  const before=validateHydroGeometry(source);
  assert.equal(before.passed,false);
  assert.match(before.errors[0],/Outward signed volume/);
  assert.ok(before.metrics.signedVolume<0);
  const preview=previewComponentMeshRepair(source);
  assert.equal(preview.status,"repaired",JSON.stringify(preview.reason));
  assert.equal(preview.method,"reverse-orientation");
  assert.equal(preview.reversedTriangles,12);
  assert.equal(preview.flips,0);
  assert.equal(preview.after.passed,true);
  assert.ok(Math.abs(preview.after.metrics.signedVolume-60)<1e-9);
  assert.ok(preview.relativeDelta<1e-12);
  assert.deepEqual(preview.geometry.positions,source.positions,"No vertex may move");
  assert.deepEqual(source,original,"Source must remain untouched");
});

test("model-level preview keeps the original and tags the repair method",()=>{
  const original=doc(reverseWinding(boxMesh({L:10,B:3,H:2})));
  const preview=previewHydroMeshRepair(original,{selectedIds:["hull"]});
  assert.equal(preview.status,"ready");
  assert.equal(validateHydroModel(preview.model).passed,true);
  assert.equal(validateHydroModel(original).passed,false);
  assert.deepEqual(preview.model.components[0].metadata.meshRepair,{method:"reverse-orientation",reversedTriangles:12});
  assert.equal(preview.model.components[0].metadata.hydro,true);
});

test("a hull whose world transform mirrors it is also fixed by reversing orientation",()=>{
  const mirrored=[-1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const geometry=boxMesh({L:10,B:3,H:2});
  assert.equal(validateHydroGeometry(geometry,{transform:mirrored}).passed,false);
  const preview=previewComponentMeshRepair(geometry,{transform:mirrored});
  assert.equal(preview.status,"repaired");
  assert.equal(preview.method,"reverse-orientation");
});

test("reversal is refused when anything besides uniform inversion is wrong",()=>{
  const open=reverseWinding(boxMesh({L:10,B:3,H:2}));
  open.indices=open.indices.slice(0,-3);
  assert.equal(previewComponentMeshRepair(open).status,"unsupported");
  // One flipped face on an otherwise outward hull is a winding conflict, not a global flip.
  const mixed=boxMesh({L:10,B:3,H:2});
  [mixed.indices[0],mixed.indices[1]]=[mixed.indices[1],mixed.indices[0]];
  const result=previewComponentMeshRepair(mixed);
  assert.equal(result.status,"unsupported");
  assert.notEqual(result.method,"reverse-orientation");
  // Flat sheet has no volume to restore.
  assert.equal(previewComponentMeshRepair({positions:[0,0,0,1,0,0,0,1,0],indices:[0,2,1]}).status,"unsupported");
});

test("STL exported after an orientation repair re-imports as a valid outward hull",()=>{
  const preview=previewHydroMeshRepair(doc(reverseWinding(boxMesh({L:10,B:3,H:2}))),{selectedIds:["hull"]});
  const text=repairedHullSTL(preview.model,["hull"]);
  const reimported=parseSTL(new TextEncoder().encode(text).buffer,"repaired.stl");
  const result=validateHydroGeometry(reimported.components[0].geometry);
  assert.equal(result.passed,true,result.errors.join("; "));
  assert.ok(Math.abs(result.metrics.signedVolume-60)<1e-6);
});
