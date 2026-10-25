import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('../assets/models/',import.meta.url);
test('real Munin preview retains all components, embedded geometry and documented scale',()=>{
 const b=readFileSync(new URL('munin-mobile-preview.glb',base));
 const m=JSON.parse(readFileSync(new URL('munin-mobile-preview.meta.json',base)));
 assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(createHash('sha256').update(b).digest('hex'),m.preview_sha256);
 assert.equal(b.length,m.preview_bytes);assert.ok(b.length<15_000_000);
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 assert.ok(j.buffers.every(x=>!x.uri));
 const names=new Set(j.nodes.map(n=>n.name));
 for(let i=1;i<=130;i++)assert.ok(names.has(`Munin-component-${String(i).padStart(4,'0')}`));
 const triangles=j.meshes.flatMap(x=>x.primitives).reduce((n,p)=>n+j.accessors[p.indices].count/3,0);
 assert.equal(triangles,m.triangles);assert.ok(triangles<250000);
 // Dimensions on original assembly drawing, sheet 2, in metres (1 mm tolerance).
 [1.02416,.88597,.80651].forEach((v,i)=>assert.ok(Math.abs(m.source_extents_m[i]-v)<.001));
 assert.equal(m.components,130);assert.equal(m.units,'metres');
});

import {MUNIN_PARTS,annotateMunin} from '../src/engineering/munin-parts.js';
import {componentGroupTree} from '../src/model/component-groups.js';
import {identifiedThrusterIntakes} from '../src/model/thruster-intake.js';
test('Munin source-backed groups classify all 130 meshes without invented thrust data',()=>{
 assert.equal(new Set(MUNIN_PARTS.map(p=>p.node)).size,130);
 const model=annotateMunin({components:MUNIN_PARTS.map(p=>({id:p.node,name:p.label,sourceObjectId:p.node,geometry:{positions:[0,0,0]},metadata:{}}))});
 const groups=componentGroupTree(model);
 assert.equal(groups.total,130);
 assert.deepEqual(groups.groups.map(g=>g.name).sort(),['Elektrisk','Sensorer','Skrog','Struktur','Thrustere']);
 assert.equal(model.components.filter(c=>c.metadata.semantic.role==='hull').length,2);
 assert.equal(model.components.filter(c=>c.metadata.semantic.role==='thruster').length,56);
 assert.equal(identifiedThrusterIntakes(model).length,0); // No guessed directions, power or disk diameters.
 assert.equal(MUNIN_PARTS.filter(p=>p.sourcePathStatus).length,10);
 for(const p of MUNIN_PARTS){assert.ok(p.sourcePath.length>1);assert.ok(p.boundsMatchErrorMm<3.3)}
});
