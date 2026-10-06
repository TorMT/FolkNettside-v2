export function createHydroInclude(modelDocument){
  const components=modelDocument?.components||[];
  const hasExplicitHydro=components.some(component=>
    Object.prototype.hasOwnProperty.call(component.metadata||{},"hydro")
  );
  return component=>{
    if(!component?.geometry)return false;
    return hasExplicitHydro?component.metadata?.hydro===true:true;
  };
}
