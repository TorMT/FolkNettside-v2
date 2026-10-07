import {extension} from "../viewers/utils.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
import {parse3MF} from "./parsers/three-mf.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
import {parseSTL} from "./parsers/stl.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
import {nativeFusionPlaceholder,parseFusionArchive} from "./parsers/fusion-archive.js?v=d106ea86f48645e34739613dfedefbaa817698fb";

function applyRules(documentModel,rules=[]){
  for(const component of documentModel.components){
    for(const rule of rules){
      if(!new RegExp(rule.match,"i").test(component.name))continue;
      if(rule.type)component.type=rule.type;
      component.metadata={
        ...component.metadata,
        hydro:rule.hydro!==false,
        ...(rule.propulsion?{propulsion:{...rule.propulsion}}:{})
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
  let documentModel;
  if(ext==="3mf")documentModel=await parse3MF(buffer,config.name);
  else if(ext==="stl")documentModel=parseSTL(buffer,config.name);
  else if(ext==="f3z")documentModel=await parseFusionArchive(buffer,config.name);
  else if(ext==="f3d")documentModel=nativeFusionPlaceholder({name:config.name,format:"F3D"});
  else throw new Error(`Unsupported engineering model format: .${ext}`);
  return applyRules(documentModel,config.componentRules);
}
