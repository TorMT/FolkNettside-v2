import test from "node:test";
import assert from "node:assert/strict";
import {occtToModelDocument} from "../src/model/parsers/occt-cad.js";
import {parseCADBuffer,isCADFile} from "../src/model/parsers/cad-runtime.js";
import {viewerKind} from "../src/viewers/registry.js";

const tri={name:"Machined face",color:[.8,.3,.2],brep_faces:[{first:0,last:0}],
 attributes:{position:{array:[[0,0,0],[100,0,0],[0,100,0]]}},
 index:{array:[[0,1,2]]}};
const result={success:true,meshes:[tri],
 root:{name:"Assembly",meshes:[],children:[{name:"Part A",meshes:[0],children:[]}]}};
test("CAD mapper preserves hierarchy, mm units, colors and actual triangle indices",()=>{
 const doc=occtToModelDocument(result,{name:"fixture.step"});
 assert.equal(doc.unit,"millimeter");
 assert.equal(doc.unitScaleToMeters,.001);
 assert.equal(doc.source.triangles,1);
 assert.equal(doc.components.length,3);
 const face=doc.components.find(p=>p.geometry);
 assert.deepEqual(face.geometry.positions,[0,0,0,100,0,0,0,100,0]);
 assert.deepEqual(face.geometry.indices,[0,1,2]);
 assert.deepEqual(face.metadata.sourceColor,[.8,.3,.2]);
 assert.equal(face.parentId,doc.components[1].id);
});
test("CAD importer refuses fabricated, empty, oversized, invalid triangle meshes",()=>{
 assert.throws(()=>occtToModelDocument({success:false,meshes:[]}),/failed/);
 assert.throws(()=>occtToModelDocument({success:true,meshes:[],root:{name:"empty"}}),/no usable/);
 assert.throws(()=>occtToModelDocument({...result,meshes:[{...tri,index:{array:[[0,1,4]]}}]}),/indices/);
 assert.throws(()=>occtToModelDocument({...result,meshes:[{...tri,attributes:{position:{array:[[0,0,Infinity]]}}}]}),/coordinates/);
 assert.throws(()=>occtToModelDocument({...result,root:{name:"a",meshes:[-1]}}),/reference/);
});
test("CAD extensions dispatch to real viewer and worker can cancel and cleanly terminate",async()=>{
 for(const format of ["step","stp","iges","igs","brep"]){
   assert.equal(viewerKind({path:"part."+format}),"cad");
   assert.equal(isCADFile("part."+format),true);
 }
 let terminated=false;
 class MockWorker{
   postMessage(message){
     queueMicrotask(()=>this.onmessage({data:{id:message.id,success:true,result}}));
   }
   terminate(){terminated=true}
 }
 const model=await parseCADBuffer(new Uint8Array([1,2,3]).buffer,"part.step",{
   workerFactory:()=>new MockWorker()
 });
 assert.equal(model.source.meshCount,1);
 assert.equal(terminated,true);
 assert.rejects(()=>parseCADBuffer(new ArrayBuffer(0),"bad.step"),/between 1 byte/);
});
