import {createModelDocument} from "../model-document.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
import {getGLTFRuntime} from "../three-runtime.js?v=4f96120049cd91bc89369b363db6c9d63719a367";

function identity(){
  return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
}

export function gltfEngineeringPoint([x,y,z],coordinateSystem="gltf-y-up"){
  if(coordinateSystem==="gltf-y-up")return [Number(x),-Number(z),Number(y)];
  if(coordinateSystem==="z-up")return [Number(x),Number(y),Number(z)];
  throw new Error(`Unsupported glTF coordinate system: ${coordinateSystem}`);
}

export function gltfPartSemantic(part={}){
  const label=String(part.label||part.group||part.node||"").toLowerCase();
  const groupKey=String(part.group_key||"").toLowerCase();
  const sfiTag=part.sfi?`sfi-${part.sfi}`:null;

  if(groupKey==="hull"||/hull and structure/.test(label)){
    return {role:"hull",subsystem:"hydro",tags:["source-geometry",sfiTag].filter(Boolean)};
  }
  if(groupKey==="super"||/deckhouse|superstructure/.test(label)){
    return {role:"superstructure",subsystem:"vessel",tags:[sfiTag].filter(Boolean)};
  }
  if(/azimuth/.test(label)){
    const tags=[sfiTag,"stern"];
    if(/port/.test(label))tags.push("port");
    if(/starboard/.test(label))tags.push("starboard");
    return {role:"thruster",subtype:"azimuth",subsystem:"propulsion",tags:tags.filter(Boolean)};
  }
  if(/tunnel thruster/.test(label)){
    return {role:"thruster",subtype:"tunnel",subsystem:"propulsion",tags:[sfiTag,"bow"].filter(Boolean)};
  }
  return {
    role:"component",
    subsystem:part.group_key||null,
    tags:[sfiTag].filter(Boolean)
  };
}

export function gltfPartDescriptor(part={},index=0){
  const node=String(part.node||`part${String(index).padStart(2,"0")}`);
  return {
    id:`gltf-${node}`,
    sourceObjectId:node,
    name:part.label||part.group||node,
    semantic:gltfPartSemantic({...part,node}),
    sourceMetadata:{
      sfi:part.sfi??null,
      group:part.group??null,
      groupKey:part.group_key??null,
      item:part.item??null,
      sourceTriangles:Number(part.source_triangles)||null,
      sourceObjects:Number(part.objects)||null
    }
  };
}

function geometryFromNode(node,{coordinateSystem="gltf-y-up"}={}){
  const positions=[];
  const indices=[];
  let triangleCount=0;

  node.updateWorldMatrix(true,true);
  node.traverse(object=>{
    if(!object.isMesh||!object.geometry)return;
    const geometry=object.geometry;
    const position=geometry.getAttribute?.("position");
    if(!position)return;
    const offset=positions.length/3;

    for(let i=0;i<position.count;i++){
      const point=object.localToWorld(object.position.clone().set(
        position.getX(i),position.getY(i),position.getZ(i)
      ));
      positions.push(...gltfEngineeringPoint([point.x,point.y,point.z],coordinateSystem));
    }

    const index=geometry.getIndex?.();
    if(index){
      for(let i=0;i<index.count;i++)indices.push(offset+index.getX(i));
      triangleCount+=Math.floor(index.count/3);
    }else{
      for(let i=0;i<position.count;i++)indices.push(offset+i);
      triangleCount+=Math.floor(position.count/3);
    }
  });

  return positions.length?{positions,indices,triangleCount}:null;
}

function rootsFromScene(scene,partMetadata=[]){
  if(partMetadata.length){
    return partMetadata.map((part,index)=>({
      node:scene.getObjectByName(String(part.node||"")),
      descriptor:gltfPartDescriptor(part,index)
    })).filter(item=>item.node);
  }

  const roots=[];
  let index=0;
  for(const child of scene.children||[]){
    let hasMesh=false;
    child.traverse?.(object=>{if(object.isMesh)hasMesh=true});
    if(!hasMesh)continue;
    const descriptor=gltfPartDescriptor({
      node:child.name||`node-${index+1}`,
      label:child.name||`Component ${index+1}`
    },index);
    roots.push({node:child,descriptor});
    index++;
  }
  return roots;
}

export async function parseGLB(buffer,name="glTF model",{
  partMetadata=[],
  coordinateSystem="gltf-y-up",
  source=null
}={}){
  const {GLTFLoader,MeshoptDecoder}=await getGLTFRuntime();
  const loader=new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await new Promise((resolve,reject)=>{
    loader.parse(buffer,"",resolve,reject);
  });
  const scene=gltf.scene||gltf.scenes?.[0];
  if(!scene)throw new Error("glTF contains no scene");
  scene.updateMatrixWorld(true);

  const rootId="gltf-root";
  const components=[{
    id:rootId,
    name,
    type:"assembly",
    parentId:null,
    transform:identity(),
    geometry:null,
    metadata:{semantic:{role:"assembly",subsystem:"vessel"}}
  }];

  const roots=rootsFromScene(scene,partMetadata);
  if(!roots.length)throw new Error("glTF scene contains no mesh-bearing component roots");

  for(const {node,descriptor} of roots){
    const geometry=geometryFromNode(node,{coordinateSystem});
    if(!geometry)continue;
    components.push({
      id:descriptor.id,
      name:descriptor.name,
      type:"component",
      sourceObjectId:descriptor.sourceObjectId,
      parentId:rootId,
      transform:identity(),
      geometry:{positions:geometry.positions,indices:geometry.indices},
      metadata:{
        semantic:descriptor.semantic,
        gltf:descriptor.sourceMetadata,
        triangleCount:geometry.triangleCount
      }
    });
  }

  const model=createModelDocument({name,format:"GLB",unit:"meter",components});
  model.source={
    format:"GLB",
    coordinateSystem,
    conversion:coordinateSystem==="gltf-y-up"?"Y-up to Engineering Z-up":"none",
    ...(source||{})
  };
  return model;
}
