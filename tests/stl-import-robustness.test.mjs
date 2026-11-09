import test from "node:test";
import assert from "node:assert/strict";
import {parseSTL} from "../src/model/parsers/stl.js";

const ASCII=`solid t
facet normal 0 0 1
 outer loop
  vertex 0 0 0
  vertex 1 0 0
  vertex 0 1 0
 endloop
endfacet
endsolid t
`;
function binary(count=2,{header="binary export"}={}){
  const bytes=new Uint8Array(84+count*50),view=new DataView(bytes.buffer);
  new TextEncoder().encodeInto(header,bytes);
  view.setUint32(80,count,true);
  for(let t=0;t<count;t++){
    let offset=84+t*50+12;
    for(const vertex of [[0,0,0],[1,0,0],[0,1,0]])for(const c of vertex){view.setFloat32(offset,c+t,true);offset+=4}
  }
  return bytes;
}
const concat=(...parts)=>{
  const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));
  let at=0;for(const p of parts){out.set(p,at);at+=p.length}
  return out.buffer;
};
const text=value=>new TextEncoder().encode(value).buffer;
const triangles=model=>model.components[0].geometry.indices.length/3;

test("ASCII STL accepts upper-case keywords and CRLF line endings",()=>{
  assert.equal(triangles(parseSTL(text(ASCII.toUpperCase()))),1);
  assert.equal(triangles(parseSTL(text(ASCII.replace(/\n/g,"\r\n")))),1);
});

test("ASCII STL with scientific notation keeps exact values",()=>{
  const model=parseSTL(text(ASCII.replace("vertex 1 0 0","vertex 1.0E+01 -0.5e-3 0")));
  assert.deepEqual(model.components[0].geometry.positions.slice(3,6),[10,-0.0005,0]);
});

test("binary STL whose header starts with 'solid' is still read as binary",()=>{
  assert.equal(triangles(parseSTL(binary(3,{header:"solid exported by CAD"}).buffer)),3);
});

test("binary STL with trailing padding bytes keeps all declared triangles",()=>{
  const model=parseSTL(concat(binary(2),new Uint8Array(6)));
  assert.equal(triangles(model),2);
});

test("truncated binary STL is rejected instead of importing an empty or partial hull",()=>{
  const whole=binary(4);
  assert.throws(()=>parseSTL(whole.slice(0,84+50*2+10).buffer),/truncated or corrupt.*4 triangles.*2 complete/);
});

test("non-STL data, empty files and zero-triangle files fail with readable errors",()=>{
  assert.throws(()=>parseSTL(new ArrayBuffer(0)),/not a readable STL/);
  assert.throws(()=>parseSTL(text("hello world, definitely not a mesh ".repeat(10))),/not a readable STL/);
  assert.throws(()=>parseSTL(binary(0).buffer),/no triangles/);
  assert.throws(()=>parseSTL(text("solid empty\nendsolid empty\n")),/no triangles|not a readable/);
});

test("NaN or Infinity never enter the geometry buffer",()=>{
  assert.throws(()=>parseSTL(text(ASCII.replace("vertex 1 0 0","vertex nan 0 0"))),/non-numeric or non-finite vertex on line 5/);
  const bad=binary(1);new DataView(bad.buffer).setFloat32(84+12,Infinity,true);
  assert.throws(()=>parseSTL(bad.buffer),/non-finite/);
});

test("ASCII STL with an incomplete final triangle is rejected",()=>{
  assert.throws(()=>parseSTL(text(ASCII.replace("  vertex 0 1 0\n",""))),/complete triangles/);
});

test("STL unit can be declared; the default stays metres",()=>{
  assert.equal(parseSTL(text(ASCII)).unitScaleToMeters,1);
  const mm=parseSTL(text(ASCII),"hull.stl",{unit:"millimeter"});
  assert.equal(mm.unit,"millimeter");
  assert.equal(mm.unitScaleToMeters,0.001);
  assert.throws(()=>parseSTL(text(ASCII),"x.stl",{unit:"parsec"}),/Unsupported STL unit/);
});

test("typed arrays and Node Buffers are accepted as STL input",()=>{
  assert.equal(triangles(parseSTL(binary(2))),2);
  assert.equal(triangles(parseSTL(Buffer.from(ASCII))),1);
  const slice=new Uint8Array(concat(new Uint8Array(7),binary(2))).subarray(7);
  assert.equal(triangles(parseSTL(slice)),2);
  assert.throws(()=>parseSTL("solid"),/ArrayBuffer or a typed array/);
});
