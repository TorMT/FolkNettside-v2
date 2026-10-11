import {createModelDocument} from "../model-document.js?v=281a134882dfdb16ab44e478f1db78320090aa04";

export const CAD_EXTENSIONS=["step","stp","iges","igs","brep"];
const MAX_TRIANGLES=1_500_000;
const MAX_PARTS=2500;
function coords(items,label){
 if(!items||typeof items.length!=="number")throw Error("CAD "+label+" is missing");
 const vectors=Array.from(items);
 const values=Array.isArray(vectors[0])?vectors.flat():vectors;
 if(values.length%3||values.length>MAX_TRIANGLES*9)throw Error("CAD "+label+" has invalid dimensions");
 for(const v of values)if(!Number.isFinite(v))throw Error("CAD "+label+" contains invalid coordinates");
 return values;
}
function meshGeometry(mesh){
 const positions=coords(mesh?.attributes?.position?.array,"positions");
 const rawIndices=mesh?.index?.array;
 const indices=rawIndices?coords(rawIndices,"triangle indices"):Array.from({length:positions.length/3},(_,i)=>i);
 if(indices.length%3||indices.length/3>MAX_TRIANGLES)throw Error("CAD mesh exceeds triangle limit");
 if(indices.some(i=>!Number.isSafeInteger(i)||i<0||i>=positions.length/3))
   throw Error("CAD mesh triangle indices are invalid");
 if(!positions.length||!indices.length)return null;
 return {positions,indices};
}
function safeName(name,fallback){
 return String(name||fallback).replace(/[\x00-\x1f]/g," ").trim().slice(0,140)||fallback;
}
/** Map the OCCT tessellation AND assembly tree into the existing ModelDocument.
 * No geometry is invented; native B-rep surfaces are tessellated by OCCT.
 * Root/child structure and colors are retained as provenance/metadata.
 */
export function occtToModelDocument(result,{name="CAD model",format="STEP",unit="millimeter"}={}){
 if(result?.success!==true)throw Error("OpenCascade failed to read "+format);
 if(!Array.isArray(result.meshes))throw Error("OpenCascade returned no mesh data");
 const parts=[],meshes=result.meshes;
 let serial=0,totalTriangles=0;
 const visits=new Set();
 const visit=(node,parentId=null,depth=0)=>{
   if(depth>40||serial>MAX_PARTS)throw Error("CAD assembly hierarchy exceeds safety limit");
   if(!node||typeof node!=="object")throw Error("Invalid CAD assembly node");
   // Reject cyclical objects from hand-crafted or malicious parser data.
   if(visits.has(node))throw Error("Recursive CAD hierarchy");
   visits.add(node);
   const id="cad-node-"+(++serial),name=safeName(node.name,"Part "+serial);
   parts.push({id,name,parentId,type:"assembly",metadata:{source:"OpenCascade"}});
   for(const index of node.meshes||[]){
     if(!Number.isSafeInteger(index)||index<0||index>=meshes.length)
       throw Error("Invalid CAD assembly mesh reference");
     const source=meshes[index],geometry=meshGeometry(source);
     if(!geometry)continue;
     totalTriangles+=geometry.indices.length/3;
     if(totalTriangles>MAX_TRIANGLES)throw Error("CAD model exceeds 1.5M triangle safety limit");
     const color=Array.isArray(source.color)&&source.color.length>=3&&
       source.color.slice(0,3).every(n=>Number.isFinite(n)&&n>=0&&n<=1)?
         source.color.slice(0,3):null;
     parts.push({id:"cad-mesh-"+serial+"-"+index,
       name:safeName(source.name,name),
       parentId:id,type:"component",geometry,
       metadata:{sourceMesh:index,brepFaceCount:source.brep_faces?.length||0,
         triangleCount:geometry.indices.length/3,...(color?{sourceColor:color}:{})}});
   }
   for(const child of node.children||[])visit(child,id,depth+1);
   visits.delete(node);
 };
 if(result.root)visit(result.root);
 else visit({name,meshes:meshes.map((_,i)=>i),children:[]});
 if(parts.every(p=>!p.geometry))throw Error("CAD file produced no usable triangles; simplify model and retry");
 const model=createModelDocument({name,format,unit,components:parts});
 model.source={format,conversion:"occt-wasm-tessellation",
   sourceFormat:format,meshCount:meshes.length,triangles:totalTriangles,
   nativeBrep:false,notice:"Tessellated preview only; exact B-rep surfaces are not preserved"};
 return model;
}
