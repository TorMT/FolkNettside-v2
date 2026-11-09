import {createModelDocument,UNIT_SCALE_TO_METERS} from "../model-document.js?v=d3dd44b0f4d38c61ccfe442d67c2773bbdb86197";
import {toArrayBuffer} from "../binary-input.js?v=d3dd44b0f4d38c61ccfe442d67c2773bbdb86197";

const HEADER_BYTES=84,TRIANGLE_BYTES=50;
const SNIFF_BYTES=2048;

/** Binary STL is `80-byte header + uint32 count + 50 bytes per triangle`. */
function binaryLayout(buffer){
  if(buffer.byteLength<HEADER_BYTES)return null;
  const count=new DataView(buffer).getUint32(80,true);
  const expected=HEADER_BYTES+count*TRIANGLE_BYTES;
  return {count,expected,exact:expected===buffer.byteLength,
    complete:Math.floor((buffer.byteLength-HEADER_BYTES)/TRIANGLE_BYTES)};
}

/** ASCII STL starts with `solid`, has no NUL bytes and names a facet early on.
 * (Many binary files also begin with "solid", so size is checked first.) */
function looksLikeASCII(buffer){
  const head=new Uint8Array(buffer,0,Math.min(buffer.byteLength,SNIFF_BYTES));
  if(head.includes(0))return false;
  const text=new TextDecoder("latin1").decode(head).replace(/^﻿/,"");
  return /^\s*solid\b/i.test(text)&&/\b(?:facet\s+normal|outer\s+loop|vertex)\b/i.test(text);
}

function parseBinary(buffer,count){
  const view=new DataView(buffer);
  // Build the public array representation directly. Previously binary STL
  // allocated two typed arrays and then duplicated both via Array.from(),
  // causing high transient memory use for large local CAD imports.
  const positions=new Array(count*9),indices=new Array(count*3);
  let offset=HEADER_BYTES,p=0;
  for(let i=0;i<count;i++){
    offset+=12;
    for(let v=0;v<3;v++){
      const x=view.getFloat32(offset,true),y=view.getFloat32(offset+4,true),z=view.getFloat32(offset+8,true);
      if(!(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z)))
        throw new Error("STL triangle "+(i+1)+" contains a non-finite (NaN/Infinity) coordinate");
      positions[p++]=x;positions[p++]=y;positions[p++]=z;offset+=12;
    }
    indices[i*3]=i*3;indices[i*3+1]=i*3+1;indices[i*3+2]=i*3+2;
    offset+=2;
  }
  return {positions,indices,triangleCount:count};
}

function lineOf(text,index){
  let line=1;
  for(let i=text.indexOf("\n");i!==-1&&i<index;i=text.indexOf("\n",i+1))line++;
  return line;
}

function parseASCII(text){
  // Case-insensitive: some exporters write VERTEX/FACET in capitals.
  const expression=/\bvertex\s+(\S+)\s+(\S+)\s+(\S+)/gi;
  const positions=[];let match;
  while((match=expression.exec(text))){
    const xyz=[Number(match[1]),Number(match[2]),Number(match[3])];
    if(!xyz.every(Number.isFinite))
      throw new Error("ASCII STL has a non-numeric or non-finite vertex on line "+lineOf(text,match.index));
    positions.push(...xyz);
  }
  if(positions.length%9!==0)
    throw new Error("ASCII STL vertices do not form complete triangles ("+positions.length/3+" vertices)");
  const indices=Array.from({length:positions.length/3},(_,i)=>i);
  return {positions,indices,triangleCount:indices.length/3};
}

function readGeometry(buffer){
  const layout=binaryLayout(buffer);
  if(layout?.exact)return parseBinary(buffer,layout.count);
  if(looksLikeASCII(buffer))return parseASCII(new TextDecoder().decode(buffer));
  if(layout&&layout.count>0){
    if(layout.expected<buffer.byteLength){
      // Trailing padding/footer bytes after the declared triangles are harmless.
      return parseBinary(buffer,layout.count);
    }
    // An absurd declared count means the bytes were never an STL header.
    if(layout.complete>0&&layout.expected<=buffer.byteLength*20){
      throw new Error("Binary STL is truncated or corrupt: the header declares "+
        layout.count.toLocaleString("en-US")+" triangles but the file only holds "+
        layout.complete.toLocaleString("en-US")+" complete triangles");
    }
  }
  throw new Error("File is not a readable STL (neither ASCII nor binary STL)");
}

/** STL carries no unit. `unit` defaults to metres (the long-standing contract);
 * callers that know better (e.g. a unit picker for millimetre CAD exports)
 * pass it through so hydrostatics sees the correct physical scale. */
export function parseSTL(input,name="STL model",{unit="meter"}={}){
  if(!Object.hasOwn(UNIT_SCALE_TO_METERS,unit))throw new Error("Unsupported STL unit: "+unit);
  const geometry=readGeometry(toArrayBuffer(input,"STL data"));
  if(!geometry.triangleCount)throw new Error("STL contains no triangles");
  return createModelDocument({
    name,format:"STL",unit,
    components:[{id:"stl-1",name,geometry:{positions:geometry.positions,indices:geometry.indices},metadata:{triangleCount:geometry.triangleCount}}]
  });
}
