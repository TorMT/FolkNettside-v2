import test from "node:test";
import assert from "node:assert/strict";
import {
  FusionConversionRequiredError,
  applySemanticManifest,
  fusionArchiveInventory,
  nativeFusionPlaceholder,
  selectFusionArchiveCandidate,
  selectSemanticManifestCandidate
} from "../src/model/parsers/fusion-archive.js";

test("Fusion archive prefers 3MF before STL and sorts deterministically",()=>{
  const paths=["z/model.stl","b/model.3mf","a/model.3mf","readme.txt"];
  assert.equal(selectFusionArchiveCandidate(paths),"a/model.3mf");
});

test("Fusion archive falls back to STL",()=>{
  assert.equal(selectFusionArchiveCandidate(["meta.json","Meshes/hull.stl"]),"Meshes/hull.stl");
});

test("Fusion inventory exposes supported fallback counts",()=>{
  assert.deepEqual(fusionArchiveInventory([
    "a.3mf","b.stl","nested/c.stl","design.f3d","notes.txt"
  ]),{
    entries:5,
    threeMF:1,
    stl:2,
    nativeFusion:1,
    candidate:"a.3mf",
    semanticManifest:null
  });
});

test("native F3D explicitly requests APS instead of guessing",()=>{
  assert.throws(
    ()=>nativeFusionPlaceholder({name:"assembly",format:"F3D"}),
    error=>error instanceof FusionConversionRequiredError&&error.code==="APS_REQUIRED"
  );
});


test("Fusion archive finds semantic sidecar deterministically",()=>{
  assert.equal(
    selectSemanticManifestCandidate(["nested/model-semantic.json","folknet-semantic.json","a.3mf"]),
    "folknet-semantic.json"
  );
});

test("semantic sidecar maps engineering roles without format-specific solver logic",()=>{
  const model={components:[
    {id:"hull",name:"Hull",sourceObjectId:"10",metadata:{}},
    {id:"az-ps",name:"Azimuth PS",sourceObjectId:"20",metadata:{}}
  ]};
  applySemanticManifest(model,{
    version:1,
    vessel:{name:"Example vessel"},
    components:[
      {sourceObjectId:"10",semantic:{role:"hull",subsystem:"hydro"},hydro:true},
      {id:"az-ps",semantic:{role:"thruster",subtype:"azimuth",subsystem:"propulsion"},propulsion:{thrust:20000,diameter:1.2}}
    ]
  });
  assert.equal(model.components[0].metadata.semantic.role,"hull");
  assert.equal(model.components[0].metadata.hydro,true);
  assert.equal(model.components[1].metadata.semantic.subtype,"azimuth");
  assert.equal(model.components[1].metadata.propulsion.thrust,20000);
  assert.deepEqual(model.semanticManifest.appliedComponentIds,["hull","az-ps"]);
});
