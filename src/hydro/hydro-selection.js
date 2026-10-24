import {componentSemantic} from "../model/semantic-assembly.js?v=b67b252dd6fbc40137d93e0430b40fd3e1089c77";
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
