import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MUNIN_MODEL} from '../src/engineering/munin-model.js';
import {applyModelRules} from '../src/model/load-model.js';
import {createHydroInclude} from '../src/hydro/hydro-selection.js';
import {validateHydroModel} from '../src/model/hull-surface-validator.js';
import {executeHydroRequest} from '../src/hydro/hydro-service.js';
import {analysisCapability} from '../src/engineering/capabilities.js';

test('Munin includes only the two actual hull meshes and validates repaired source geometry',()=>{
 const b=readFileSync(new URL('../assets/models/munin-mobile-preview.glb',import.meta.url));
 const length=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+length)),bin=b.subarray(28+length);
 const read=i=>{
  const a=g.accessors[i],v=g.bufferViews[a.bufferView],count=a.count*(a.type==='VEC3'?3:1);
  assert.ok([5125,5126].includes(a.componentType));
  return Array.from({length:count},(_,k)=>bin[a.componentType===5126?'readFloatLE':'readUInt32LE']((v.byteOffset||0)+(a.byteOffset||0)+k*4));
 };
 const model=applyModelRules({unitScaleToMeters:1,components:g.nodes.filter(n=>n.mesh!==undefined).map(n=>{
  const p=g.meshes[n.mesh].primitives[0];
  return {id:n.name,sourceObjectId:n.name,transform:n.matrix,metadata:{hydro:false},geometry:{positions:read(p.attributes.POSITION),indices:read(p.indices)}};
 })},MUNIN_MODEL.componentRules);
 assert.equal(model.components.length,130);
 const selected=model.components.filter(createHydroInclude(model));
 assert.deepEqual(selected.map(c=>c.id),['Munin-component-0015','Munin-component-0016']);
 assert.ok(model.components.every(c=>c.metadata.viewerGroup));
 const validation=validateHydroModel(model);
 assert.equal(validation.passed,true,JSON.stringify(validation.errors));
 assert.equal(validation.components.length,2);
 for(const c of validation.components){
  assert.equal(c.metrics.degenerateTriangles,0);
  assert.equal(c.metrics.boundaryEdges,0);
  assert.equal(c.metrics.nonManifoldEdges,0);
  assert.equal(c.metrics.selfIntersections,0);
  assert.equal(c.metrics.edgeConnectedShells,1);
  assert.equal(c.metrics.intersectionScanExhaustive,true);
 }
 assert.equal(analysisCapability(MUNIN_MODEL,'hydro').enabled,true);
 assert.equal(analysisCapability(MUNIN_MODEL,'model').enabled,true);
 const reference=JSON.parse(readFileSync(new URL('./fixtures/munin-step-reference.json',import.meta.url)));
 for(const hull of reference.hulls){
  const component=model.components.find(c=>c.id===hull.node);
  for(const sample of [{waterline_m:0,...hull.full},...hull.samples.filter(s=>s.status==='reference')]){
   const numerical=executeHydroRequest({unitScaleToMeters:1,components:[component]},'analyze',{waterline:sample.waterline_m});
   // Preview tessellation is approximate: sampled volumes agree within 3%.
   assert.ok(Math.abs(numerical.volume/sample.volume_m3-1)<.03);
   numerical.centerOfBuoyancy.forEach((v,i)=>assert.ok(Math.abs(v-sample.center_of_buoyancy_m[i])<.005));
  }
 }
 const full=executeHydroRequest(model,'analyze',{waterline:0});
 assert.ok(Math.abs(full.volume-.08784307767580128)<1e-9);
 const result=executeHydroRequest(model,'analyze',{waterline:-.22});
 assert.ok(result.volume>0&&result.volume<full.volume);
 assert.ok(result.waterplane.area>0);
 assert.equal(result.components.length,2);
 const curve=executeHydroRequest(model,'curve',{minWaterline:-.404,maxWaterline:-.027,samples:9});
 assert.equal(curve.length,9);
 const solved=executeHydroRequest(model,'solve',{targetVolume:result.volume,minWaterline:-.404,maxWaterline:-.027,tolerance:1e-9});
 assert.ok(Math.abs(solved.waterline+.22)<1e-5);
 // Keep the runtime validator active; breaking one real hull still blocks analysis.
 const removed=selected[0].geometry.indices.splice(0,3);
 assert.throws(()=>executeHydroRequest(model,'analyze',{waterline:-.22}),/preflight blocked/);
 selected[0].geometry.indices.unshift(...removed);
});
