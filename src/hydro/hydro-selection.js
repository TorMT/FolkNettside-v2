import {componentSemantic} from "../model/semantic-assembly.js?v=1a6e79a179cf3eb7de0bd0ca8920153fb3746b40";
export function createHydroInclude(modelDocument){
  const components=modelDocument?.components||[];
  const hasExplicitHydro=components.some(component=>{
    const metadata=component.metadata||{};
    const semantic=componentSemantic(component);
    return Object.prototype.hasOwnProperty.call(metadata,"hydro")
      ||semantic.hydro!==null&&semantic.hydro!==undefined;
  });
  return component=>{
    if(!component?.geometry)return false;
    if(!hasExplicitHydro)return true;
    const metadata=component.metadata||{};
    if(Object.prototype.hasOwnProperty.call(metadata,"hydro"))return metadata.hydro===true;
    const semantic=componentSemantic(component);
    if(typeof semantic.hydro==="boolean")return semantic.hydro;
    if(semantic.hydro&&typeof semantic.hydro==="object")return semantic.hydro.include!==false;
    return false;
  };
}
