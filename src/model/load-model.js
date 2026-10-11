import {extension} from "../viewers/utils.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {parseCADBuffer} from "./parsers/cad-runtime.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {parse3MF} from "./parsers/three-mf.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {parseSTL} from "./parsers/stl.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {nativeFusionPlaceholder,parseFusionArchive} from "./parsers/fusion-archive.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {parseGLB} from "./parsers/gltf.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";

export function applyModelRules(documentModel,rules=[]){
  for(const component of documentModel.components){
    for(const rule of rules){
      const matcher=new RegExp(rule.match,"i");
      if(![component.name,component.sourceObjectId].filter(Boolean).some(value=>matcher.test(String(value))))continue;
      if(rule.type)component.type=rule.type;
      component.metadata={
        ...component.metadata,
        ...(rule.hydro!==undefined?{hydro:rule.hydro}:{}),
        ...(rule.propulsion?{propulsion:{...(component.metadata?.propulsion||{}),...rule.propulsion}}:{}),
        ...(rule.semantic?{semantic:{...(component.metadata?.semantic||{}),...rule.semantic}}:{})
      };
      break;
    }
  }
  return documentModel;
}

export async function loadModelDocument(config){
  if(!config?.sourcePath)throw new Error("Model sourcePath is missing");
  const response=await fetch(config.sourcePath);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${config.sourcePath}`);
  const buffer=await response.arrayBuffer();
  const ext=extension(config.sourcePath);
  let partMetadata=[];
  if(config.partMetadataPath){
    const metadataResponse=await fetch(config.partMetadataPath);
    if(!metadataResponse.ok)throw new Error(`HTTP ${metadataResponse.status} while loading ${config.partMetadataPath}`);
    partMetadata=await metadataResponse.json();
    if(!Array.isArray(partMetadata))throw new Error("partMetadataPath must resolve to an array");
  }
  let documentModel;
  if(["step","stp","iges","igs","brep"].includes(ext))documentModel=await parseCADBuffer(buffer,config.name||"CAD model",{format:ext});
  else if(ext==="3mf")documentModel=await parse3MF(buffer,config.name);
  else if(ext==="stl")documentModel=parseSTL(buffer,config.name);
  else if(ext==="f3z")documentModel=await parseFusionArchive(buffer,config.name);
  else if(ext==="f3d")documentModel=nativeFusionPlaceholder({name:config.name,format:"F3D"});
  else if(ext==="glb")documentModel=await parseGLB(buffer,config.name,{
    partMetadata,
    coordinateSystem:config.coordinateSystem||"gltf-y-up",
    source:config.source||null
  });
  else throw new Error(`Unsupported engineering model format: .${ext}`);

  if(config.defaultHydro!==undefined){
    for(const component of documentModel.components){
      if(!component.geometry)continue;
      component.metadata={...(component.metadata||{}),hydro:Boolean(config.defaultHydro)};
    }
  }
  return applyModelRules(documentModel,config.componentRules);
}
