import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MUNIN_MODEL} from '../src/engineering/munin-model.js';
import {applyModelRules} from '../src/model/load-model.js';
import {createHydroInclude} from '../src/hydro/hydro-selection.js';
import {validateHydroModel} from '../src/model/hull-surface-validator.js';
import {analysisCapability} from '../src/engineering/capabilities.js';

test('Munin includes only the two actual hull meshes and blocks failed source geometry',()=>{
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
 assert.equal(validation.passed,false);
 assert.equal(validation.components.length,2);
 assert.ok(validation.errors.every(e=>e.includes('degenerate triangles')));
 assert.equal(analysisCapability(MUNIN_MODEL,'hydro').enabled,false);
 assert.equal(analysisCapability(MUNIN_MODEL,'model').enabled,true);
});
