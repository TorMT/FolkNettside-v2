import {createModelDocument} from "../model-document.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";

/**
 * Read-only, triangle-mesh OBJ import for the shared Engineering model selector.
 * Units are explicit because OBJ has no standard unit metadata.
 * This is display geometry only: OBJ is not hydrostatic evidence.
 */
export function parseOBJ(buffer,name="OBJ preview",{unit="millimeter"}={}){
  if(buffer?.byteLength>25_000_000)throw new Error("OBJ file exceeds 25 MB limit");
  const text=typeof buffer==="string"?buffer:new TextDecoder().decode(buffer);
  if(text.length>25_000_000)throw new Error("OBJ text exceeds 25 MB limit");
  const sourceVertices=[],groups=[];
  let current={name:"OBJ mesh",triangles:[]};
  const flush=()=>{if(current.triangles.length)groups.push(current)};
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#"))continue;
    const values=line.split(/\s+/),command=values.shift();
    if(command==="v"){
      if(values.length<3)throw new Error("OBJ vertex lacks XYZ");
      const xyz=values.slice(0,3).map(Number);
      if(xyz.some(value=>!Number.isFinite(value)))throw new Error("OBJ vertex is not finite");
      if(sourceVertices.length>=500_000)throw new Error("OBJ exceeds vertex limit");
      sourceVertices.push(xyz);
    }else if(command==="o"||command==="g"){
      if(current.triangles.length)flush();
      current={name:values.join(" ").slice(0,120)||"OBJ mesh",triangles:[]};
    }else if(command==="f"){
      if(values.length<3||values.length>64)throw new Error("Invalid OBJ face");
      const face=values.map(token=>{
        const index=Number(token.split("/")[0]);
        if(!Number.isSafeInteger(index)||index===0)throw new Error("Invalid OBJ index");
        const absolute=index>0?index-1:sourceVertices.length+index;
        if(absolute<0||absolute>=sourceVertices.length)throw new Error("OBJ index out of range");
        return absolute;
      });
      for(let j=1;j<face.length-1;j++){
        current.triangles.push(face[0],face[j],face[j+1]);
        if(current.triangles.length>1_050_000)throw new Error("OBJ exceeds triangle limit");
      }
    }
  }
  flush();
  if(!groups.length)throw new Error("OBJ contains no mesh faces");
  const components=groups.map((group,i)=>{
    const positions=[],indices=[],local=new Map();
    for(const sourceId of group.triangles){
      let id=local.get(sourceId);
      if(id===undefined){
        id=positions.length/3;local.set(sourceId,id);
        positions.push(...sourceVertices[sourceId]);
      }
      indices.push(id);
    }
    return {id:"obj-"+(i+1),name:group.name,
      geometry:{positions,indices},
      metadata:{triangleCount:indices.length/3,hydro:false,sourceType:"visual-preview"}};
  });
  return createModelDocument({name,format:"OBJ",unit,components});
}
