import {extension} from "../viewers/utils.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
import {parse3MF} from "./parsers/three-mf.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
import {parseSTL} from "./parsers/stl.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
import {nativeFusionPlaceholder,parseFusionArchive} from "./parsers/fusion-archive.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";

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
