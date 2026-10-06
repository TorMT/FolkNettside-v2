import {getJSZip} from "../../vendor/jszip.js";
import {createModelDocument} from "../model-document.js";

function xml(text){
  const doc=new DOMParser().parseFromString(text,"application/xml");
  if(doc.querySelector("parsererror"))throw new Error("Could not parse 3MF model XML");
  return doc;
}
function number(value,fallback=0){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback}
function transformMatrix(value){
  if(!value)return null;
  const v=value.trim().split(/\s+/).map(Number);
  if(v.length!==12||v.some(n=>!Number.isFinite(n)))return null;
  return [
    v[0],v[1],v[2],0,
    v[3],v[4],v[5],0,
    v[6],v[7],v[8],0,
    v[9],v[10],v[11],1
  ];
}
function parseMesh(object){
  const mesh=object.getElementsByTagNameNS("*","mesh")[0];
  if(!mesh)return null;
  const positions=[];
  for(const vertex of mesh.getElementsByTagNameNS("*","vertex")){
    positions.push(number(vertex.getAttribute("x")),number(vertex.getAttribute("y")),number(vertex.getAttribute("z")));
  }
  const indices=[];
  for(const triangle of mesh.getElementsByTagNameNS("*","triangle")){
    indices.push(number(triangle.getAttribute("v1")),number(triangle.getAttribute("v2")),number(triangle.getAttribute("v3")));
  }
  return {positions,indices};
}

export async function parse3MF(buffer,name="3MF model"){
  const JSZip=await getJSZip(),zip=await JSZip.loadAsync(buffer);
  const modelPath=Object.keys(zip.files).find(path=>path.toLowerCase().endsWith(".model"));
  if(!modelPath)throw new Error("3MF archive contains no .model document");
  const doc=xml(await zip.file(modelPath).async("text")),root=doc.documentElement;
  const unit=root.getAttribute("unit")||"millimeter";
  const objects=new Map([...doc.getElementsByTagNameNS("*","object")].map(object=>[
    object.getAttribute("id"),
    {
      id:object.getAttribute("id"),
      name:object.getAttribute("name")||`Object ${object.getAttribute("id")}`,
      geometry:parseMesh(object),
      refs:[...object.getElementsByTagNameNS("*","component")].map(ref=>({
        objectId:ref.getAttribute("objectid"),transform:transformMatrix(ref.getAttribute("transform"))
      }))
    }
  ]));

  const components=[];
  let instance=0;
  function addObject(objectId,parentId=null,transform=null,nameOverride=null){
    const object=objects.get(objectId);if(!object)return;
    const id=`3mf-${objectId}-${++instance}`;
    if(object.geometry)components.push({
      id,name:nameOverride||object.name,sourceObjectId:objectId,parentId,transform,geometry:object.geometry,
      metadata:{triangleCount:object.geometry.indices.length/3}
    });
    for(const ref of object.refs)addObject(ref.objectId,id,ref.transform);
  }
  for(const item of doc.getElementsByTagNameNS("*","item")){
    addObject(item.getAttribute("objectid"),null,transformMatrix(item.getAttribute("transform")));
  }
  return createModelDocument({name,format:"3MF",unit,components});
}
