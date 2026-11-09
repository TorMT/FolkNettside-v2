import {extension} from "../viewers/utils.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseCADBuffer} from "./parsers/cad-runtime.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parse3MF} from "./parsers/three-mf.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseSTL} from "./parsers/stl.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseOBJ} from "./parsers/obj.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {nativeFusionPlaceholder,parseFusionArchive} from "./parsers/fusion-archive.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseGLB} from "./parsers/gltf.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";

export function applyModelRules(documentModel,rules=[]){
  for(const component of documentModel.components){
    for(const rule of rules){
      const matcher=new RegExp(rule.match,"i");
      if(![component.name,component.sourceObjectId].filter(Boolean).some(value=>matcher.test(String(value))))continue;
      if(rule.type)component.type=rule.type;
      component.metadata={
        ...component.metadata,
        ...(rule.viewerGroup?{viewerGroup:rule.viewerGroup}:{}),
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
  let sourcePath=config.sourcePath,response=null;
  // Opt-in original-file probe. A missing original is expected during staged
  // publication; retaining the visual fallback avoids broken model selectors.
  if(config.originalSourcePath){
    try{
      const candidate=await fetch(config.originalSourcePath);
      if(candidate.ok){sourcePath=config.originalSourcePath;response=candidate}
    }catch{ /* Original not yet published; load the labelled preview. */ }
  }
  if(!response)response=await fetch(sourcePath);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${sourcePath}`);
  const buffer=await response.arrayBuffer();
  const ext=extension(sourcePath);
  let partMetadata=config.partMetadata||[];
  if(!Array.isArray(partMetadata))throw new Error("partMetadata must be an array");
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
  else if(ext==="obj")documentModel=parseOBJ(buffer,config.name,{unit:config.unit||"millimeter"});
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
  documentModel.loadedSourcePath=sourcePath;
  documentModel.originalGeometryLoaded=Boolean(config.originalSourcePath&&sourcePath===config.originalSourcePath);
  return applyModelRules(documentModel,config.componentRules);
}
