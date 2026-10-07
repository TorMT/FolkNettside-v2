import test from "node:test";
import assert from "node:assert/strict";
import {
  componentSemantic,semanticAssembly,semanticComponents,semanticSummary
} from "../src/model/semantic-assembly.js";

const model={
  components:[
    {id:"vessel",name:"Vessel",type:"assembly",metadata:{semantic:{role:"assembly",subsystem:"vessel"}}},
    {id:"hull",name:"Hull",parentId:"vessel",geometry:{positions:[0,0,0]},metadata:{semantic:{role:"hull",subsystem:"hydro",tags:["watertight"],hydro:{include:true}}}},
    {id:"az-ps",name:"Port azimuth",parentId:"vessel",metadata:{semantic:{role:"thruster",subtype:"azimuth",subsystem:"propulsion",tags:["stern"],thruster:{thrust:20000,diameter:1.2}}}},
    {id:"tunnel",name:"Bow tunnel",parentId:"vessel",metadata:{propulsion:{type:"tunnel",thrust:5000,axis:[0,1,0]}}}
  ]
};

test("semantic assembly preserves hierarchy and depth",()=>{
  const assembly=semanticAssembly(model);
  assert.equal(assembly.roots.length,1);
  assert.equal(assembly.byId.get("vessel").depth,0);
  assert.equal(assembly.byId.get("hull").depth,1);
  assert.deepEqual(assembly.byId.get("az-ps").path,["vessel","az-ps"]);
});

test("semantic metadata is explicit and legacy propulsion is inferred safely",()=>{
  const hull=componentSemantic(model.components[1]);
  assert.equal(hull.role,"hull");
  assert.deepEqual(hull.tags,["watertight"]);

  const legacy=componentSemantic(model.components[3]);
  assert.equal(legacy.role,"thruster");
  assert.equal(legacy.subtype,"tunnel");
  assert.equal(legacy.thruster.thrust,5000);
});

test("semantic component filters find engineering subsystems without name guessing",()=>{
  assert.deepEqual(semanticComponents(model,{role:"thruster"}).map(node=>node.id),["az-ps","tunnel"]);
  assert.deepEqual(semanticComponents(model,{subsystem:"hydro"}).map(node=>node.id),["hull"]);
  assert.deepEqual(semanticComponents(model,{tag:"stern"}).map(node=>node.id),["az-ps"]);
});

test("semantic summary reports roles and geometry",()=>{
  const summary=semanticSummary(model);
  assert.equal(summary.components,4);
  assert.equal(summary.geometryComponents,1);
  assert.equal(summary.roles.thruster,2);
  assert.equal(summary.roles.hull,1);
});

test("semantic assembly rejects missing parents and cycles",()=>{
  assert.throws(()=>semanticAssembly({components:[{id:"x",parentId:"missing"}]}),/Missing parent/);
  assert.throws(()=>semanticAssembly({components:[
    {id:"a",parentId:"b"},{id:"b",parentId:"a"}
  ]}),/cycle|unreachable/i);
});
