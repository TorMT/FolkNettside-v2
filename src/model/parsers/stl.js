import {createModelDocument} from "../model-document.js?v=12f46a197391dc034f9aa7438b7fbd238188581f";

function binaryLooksValid(buffer){
  if(buffer.byteLength<84)return false;
  const view=new DataView(buffer);
  const count=view.getUint32(80,true);
  return 84+count*50===buffer.byteLength;
}

function parseBinary(buffer){
  const view=new DataView(buffer),count=view.getUint32(80,true);
  // Build the public array representation directly. Previously binary STL
  // allocated two typed arrays and then duplicated both via Array.from(),
  // causing high transient memory use for large local CAD imports.
  const positions=new Array(count*9),indices=new Array(count*3);
  let offset=84,p=0;
  for(let i=0;i<count;i++){
    offset+=12;
    for(let v=0;v<3;v++){
      positions[p++]=view.getFloat32(offset,true);offset+=4;
      positions[p++]=view.getFloat32(offset,true);offset+=4;
      positions[p++]=view.getFloat32(offset,true);offset+=4;
    }
    indices[i*3]=i*3;indices[i*3+1]=i*3+1;indices[i*3+2]=i*3+2;
    offset+=2;
  }
  return {positions,indices,triangleCount:count};
}

function parseASCII(text){
  const expression=/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g;
  const positions=[];let match;
  while((match=expression.exec(text)))positions.push(Number(match[1]),Number(match[2]),Number(match[3]));
  const indices=Array.from({length:positions.length/3},(_,i)=>i);
  return {positions,indices,triangleCount:Math.floor(indices.length/3)};
}

export function parseSTL(buffer,name="STL model"){
  const geometry=binaryLooksValid(buffer)?parseBinary(buffer):parseASCII(new TextDecoder().decode(buffer));
  return createModelDocument({
    name,format:"STL",unit:"meter",
    components:[{id:"stl-1",name,geometry:{positions:geometry.positions,indices:geometry.indices},metadata:{triangleCount:geometry.triangleCount}}]
  });
}
