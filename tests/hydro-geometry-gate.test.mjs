import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,reverseWinding} from "../src/hydro/fixtures.js";
import {validateHydroGeometry,validateHydroModel} from "../src/model/hull-surface-validator.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
const valid=()=>boxMesh({L:10,B:3,H:2});
const model=geometry=>({unitScaleToMeters:1,components:[
 {id:"hull",name:"External hull",geometry,metadata:{hydro:true}},
 {id:"equipment",name:"Equipment",geometry:valid(),metadata:{hydro:false}}
]});
test("outward analytical hull has closed edges and correct signed volume",()=>{
 const g=validateHydroGeometry(valid());
 assert.equal(g.passed,true,JSON.stringify(g.errors));
 assert.equal(g.metrics.boundaryEdges,0);
 assert.equal(g.metrics.nonManifoldEdges,0);
 assert.equal(g.metrics.windingConflicts,0);
 assert.ok(Math.abs(g.metrics.signedVolume-60)<1e-8);
});
test("open shell cannot enter analysis, curve, solve, heel or GZ",()=>{
 const g=valid();g.indices.splice(0,6);
 const m=model(g);
 const status=executeHydroRequest(m,"validate");
 assert.equal(status.passed,false);
 assert.ok(status.errors.some(e=>e.includes("open boundary")));
 for(const [type,payload] of [
   ["analyze",{waterline:1}],["curve",{minWaterline:0,maxWaterline:2,samples:3}],
   ["solve",{targetVolume:30,minWaterline:0,maxWaterline:2}],
   ["gz",{targetVolume:30,kg:0.5}],
   ["attitude",{heelDeg:0,targetVolume:30,centerOfGravity:[0,0,0.5]}]
 ]) assert.throws(()=>executeHydroRequest(m,type,payload),/Hydro preflight blocked/);
});
test("reversed shell is rejected even though it remains topologically closed",()=>{
 const g=validateHydroGeometry(reverseWinding(valid()));
 assert.equal(g.metrics.boundaryEdges,0);
 assert.equal(g.passed,false);
 assert.match(g.errors.join("|"),/Outward signed volume/);
});
test("a single flipped face produces inconsistent winding",()=>{
 const g=valid();const a=g.indices[1];g.indices[1]=g.indices[2];g.indices[2]=a;
 const v=validateHydroGeometry(g);
 assert.equal(v.passed,false);
 assert.ok(v.metrics.windingConflicts>0);
});
test("damaged and invalid geometry is rejected without accidental computation",()=>{
 const g=valid();g.positions[0]=NaN;
 assert.equal(validateHydroGeometry(g).passed,false);
 const badIndex=valid();badIndex.indices[0]=9999;
 assert.equal(validateHydroGeometry(badIndex).passed,false);
 assert.equal(validateHydroGeometry(valid(),{scale:0}).passed,false);
});
test("non-manifold duplicate face is rejected",()=>{
 const g=valid();g.indices.push(...g.indices.slice(0,3));
 const v=validateHydroGeometry(g);
 assert.equal(v.passed,false);
 assert.ok(v.metrics.nonManifoldEdges>0);
});
test("world-space scale and transformations participate in validation",()=>{
 const v=validateHydroGeometry(valid(),{scale:2,transform:[1,0,0,0,0,1,0,0,0,0,1,0,10000,0,0,1]});
 assert.equal(v.passed,true);
 assert.ok(Math.abs(v.metrics.signedVolume-480)<1e-8);
 const mirrored=validateHydroGeometry(valid(),{transform:[-1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]});
 assert.equal(mirrored.passed,false);
});
test("unselected components do not poison an explicitly chosen hull",()=>{
 const m=model(valid());m.components[1].geometry=reverseWinding(valid());
 const result=executeHydroRequest(m,"validate");
 assert.equal(result.passed,true);
 assert.equal(result.components.length,1);
 assert.ok(executeHydroRequest(m,"analyze",{waterline:1}).volume>0);
});
test("missing selected hydro geometry is a hard error",()=>{
 const m={components:[{id:"hull",geometry:valid(),metadata:{hydro:false}}]};
 const gate=validateHydroModel(m);
 assert.equal(gate.passed,false);
 assert.match(gate.errors.join("|"),/No hydrostatic geometry/);
});
test("no preflight can certify source provenance or external hull isolation",()=>{
 const gate=validateHydroModel(model(valid()));
 assert.equal(gate.passed,true);
 assert.equal(gate.requiresIndependentReview,true);
 assert.ok(gate.warnings.some(x=>x.includes("not vessel certification")));
});


test("missing vertex buffers with indices are reported as invalid, not an exception",()=>{
 const result=validateHydroGeometry({indices:[0,1,2]});
 assert.equal(result.passed,false);
 assert.ok(result.errors.some(error=>error.includes("Vertex coordinates")));
 assert.ok(result.errors.some(error=>error.includes("index")));
});
test("malformed CAD-derived transforms and nonfinite unit scales fail closed",()=>{
 const geometry=valid();
 for(const options of [
  {transform:Array(16).fill(NaN)},
  {transform:Array(12).fill(0)},
  {scale:Infinity},
  {scale:-0.001},
  {tolerance:0}
 ]){
   const result=validateHydroGeometry(geometry,options);
   assert.equal(result.passed,false,JSON.stringify(options));
 }
});
