import {componentSemantic} from "../model/semantic-assembly.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
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
