import test from "node:test";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {parseSTL} from "../src/model/parsers/stl.js";

function syntheticBinarySTL(count){
  const buffer=new ArrayBuffer(84+count*50);
  const view=new DataView(buffer);
  view.setUint32(80,count,true);
  for(let triangle=0;triangle<count;triangle++){
    const offset=84+triangle*50;
    for(let vertex=0;vertex<3;vertex++){
      const base=offset+12+vertex*12;
      view.setFloat32(base,triangle%300+vertex*.2,true);
      view.setFloat32(base+4,triangle%100-vertex*.5,true);
      view.setFloat32(base+8,vertex+triangle/10000,true);
    }
  }
  return buffer;
}

test("binary STL large local geometry decodes once with identical numeric array contract",()=>{
  const count=125000; // 6.25 MiB sample, entirely generated inside test.
  const buffer=syntheticBinarySTL(count);
  const start=performance.now();
  const doc=parseSTL(buffer,"synthetic-stress.stl");
  const elapsedMs=performance.now()-start;
  const mesh=doc.components[0].geometry;
  assert.equal(doc.format,"STL");
  assert.ok(Array.isArray(mesh.positions),"Keep existing consumers' Array contract");
  assert.ok(Array.isArray(mesh.indices),"Keep existing consumers' Array contract");
  assert.equal(mesh.positions.length,count*9);
  assert.equal(mesh.indices.length,count*3);
  assert.equal(mesh.indices[0],0);
  assert.equal(mesh.indices.at(-1),count*3-1);
  assert.ok(Math.abs(mesh.positions[3]-.2)<1e-6,"Float32 precision changed");
  assert.equal(doc.components[0].metadata.triangleCount,count);
  assert.ok(elapsedMs<30000,"STL parser stalled on moderate large input ("+
    Math.round(elapsedMs)+"ms)");
});
