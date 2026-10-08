import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh,reverseWinding} from "../src/hydro/fixtures.js";
import {createModelDocument} from "../src/model/model-document.js";
import {prepareGenericHydroImport,splitSurfaceBodies,selectedHydroSurfaceIds,withHydroSurfaceSelection} from "../src/model/generic-hydro-import.js";
import {validateHydroModel} from "../src/model/hull-surface-validator.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";

const combine=(...parts)=>{
 const p=[],i=[];
 for(const part of parts){
   const offset=p.length/3;
   p.push(...part.positions);
   i.push(...part.indices.map(x=>x+offset));
 }
 return {positions:p,indices:i};
};
test("STL triangle soup with two closed disconnected shells separates into two independently selectable surfaces",()=>{
 const mesh=combine(boxMesh({L:10,B:4,H:3}),boxMesh({L:1,B:1,H:1,origin:[0,0,1]}));
 const source=createModelDocument({name:"import.stl",format:"STL",unit:"meter",
   components:[{id:"part",name:"STL source",geometry:mesh}]});
 const prepared=prepareGenericHydroImport(source);
 assert.equal(prepared.components.length,2);
 assert.equal(prepared.components[0].geometry.indices.length,36);
 assert.deepEqual(selectedHydroSurfaceIds(prepared),[]);
 assert.equal(validateHydroModel(prepared).passed,false,"Must require explicit hull selection");
 const hull=withHydroSurfaceSelection(prepared,[prepared.components[0].id]);
 assert.equal(validateHydroModel(hull).passed,true);
 assert.ok(Math.abs(executeHydroRequest(hull,"analyze",{waterline:1}).volume-40)<1e-8);
 assert.equal(hull.components[1].metadata.hydro,false);
});
test("STL without an index buffer also splits connected shells",()=>{
 const b=boxMesh({L:2,B:2,H:2});
 const positions=b.indices.flatMap(i=>b.positions.slice(i*3,i*3+3));
 const single=splitSurfaceBodies({positions});
 assert.equal(single.length,1);
 assert.equal(single[0].triangleCount,12);
});
test("3MF assembly object IDs and source-defined unit are retained",()=>{
 const source=createModelDocument({name:"assembly.3mf",format:"3MF",unit:"millimeter",
   components:[{id:"hull",name:"Hull",geometry:boxMesh({L:10000,B:4000,H:3000})},
     {id:"equipment",name:"Equipment",geometry:reverseWinding(boxMesh({L:100,B:100,H:100}))}]});
 const prepared=prepareGenericHydroImport(source);
 assert.deepEqual(prepared.components.map(x=>x.id),["hull","equipment"]);
 assert.equal(prepared.unitScaleToMeters,.001);
 assert.throws(()=>prepareGenericHydroImport(source,{unit:"meter"}),/3MF/);
 const checked=withHydroSurfaceSelection(prepared,["hull"]);
 assert.equal(validateHydroModel(checked).passed,true);
 assert.ok(Math.abs(executeHydroRequest(checked,"analyze",{waterline:1}).volume-40)<1e-8);
});
test("STL explicit unit conversion affects hydro metres, not source triangle coordinates",()=>{
 const source=createModelDocument({name:"millimetre boat",format:"STL",unit:"meter",
   components:[{id:"stl",geometry:boxMesh({L:10000,B:4000,H:3000})}]});
 const prepared=prepareGenericHydroImport(source,{unit:"millimeter"});
 assert.equal(prepared.components[0].geometry.positions[0],-5000);
 assert.equal(prepared.unitScaleToMeters,.001);
 const checked=withHydroSurfaceSelection(prepared,[prepared.components[0].id]);
 assert.ok(Math.abs(executeHydroRequest(checked,"analyze",{waterline:1}).volume-40)<1e-8);
});
test("invalid surface selections and malicious geometry are rejected before computation",()=>{
 const source=createModelDocument({name:"test",format:"STL",
   components:[{id:"a",geometry:boxMesh({L:2,B:2,H:2})}]});
 const prepared=prepareGenericHydroImport(source);
 assert.throws(()=>withHydroSurfaceSelection(prepared,["unknown"]),/Unknown surface/);
 assert.throws(()=>prepareGenericHydroImport(source,{unit:"knot"}),/Unsupported import unit/);
 const damaged=boxMesh({L:2,B:2,H:2});damaged.indices[2]=99999;
 assert.throws(()=>splitSurfaceBodies(damaged),/Invalid source mesh triangle/);
});
test("unclosed shell remains blocked after manual selection",()=>{
 const bad=boxMesh({L:2,B:2,H:2});bad.indices.splice(0,6);
 const source=createModelDocument({name:"bad",format:"STL",components:[{id:"one",geometry:bad}]});
 const prepared=prepareGenericHydroImport(source);
 const selected=withHydroSurfaceSelection(prepared,[prepared.components[0].id]);
 assert.equal(validateHydroModel(selected).passed,false);
 assert.throws(()=>executeHydroRequest(selected,"analyze",{waterline:1}),/preflight blocked/);
});

test("generic source axes can be reoriented to Z-up using rigid rotations",()=>{
 const base=boxMesh({L:10,B:3,H:2});
 // Input was exported Y-up: inverse transform of the canonical (x,y,z).
 const yUp=base.positions.slice();
 for(let i=0;i<yUp.length;i+=3){
   const y=base.positions[i+1],z=base.positions[i+2];
   yUp[i+1]=z;yUp[i+2]=-y;
 }
 const source=createModelDocument({name:"source-y-up",format:"STL",components:[
   {id:"body",geometry:{positions:yUp,indices:base.indices}}
 ]});
 const prepared=prepareGenericHydroImport(source,{upAxis:"y-up"});
 const selected=withHydroSurfaceSelection(prepared,[prepared.components[0].id]);
 assert.equal(validateHydroModel(selected).passed,true);
 assert.ok(Math.abs(executeHydroRequest(selected,"analyze",{waterline:1}).volume-30)<1e-7);
 assert.equal(prepared.importUpAxis,"y-up");
 assert.throws(()=>prepareGenericHydroImport(source,{upAxis:"down"}),/Unsupported source up axis/);
});
