import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=e39b98077eed11779471c81b49cce38b5350d256";

let modelDocument=null;

function includeHydro(component){
  if(!component?.geometry)return false;
  const explicit=modelDocument?.components?.some(item=>Object.prototype.hasOwnProperty.call(item.metadata||{},"hydro"));
  return explicit?component.metadata?.hydro===true:true;
}

self.onmessage=event=>{
  const {id,type,payload={}}=event.data||{};
  try{
    if(type==="setModel"){
      modelDocument=payload.modelDocument;
      self.postMessage({id,ok:true,result:{components:modelDocument?.components?.length||0}});
      return;
    }
    if(!modelDocument)throw new Error("Hydro worker has no model loaded");

    let result;
    if(type==="analyze"){
      result=analyzeModelDocument(modelDocument,payload.waterline,{include:includeHydro});
    }else if(type==="curve"){
      result=hydroCurve(modelDocument,{
        minWaterline:payload.minWaterline,
        maxWaterline:payload.maxWaterline,
        samples:payload.samples,
        include:includeHydro
      });
    }else if(type==="solve"){
      result=solveWaterlineForVolume(modelDocument,payload.targetVolume,{
        minWaterline:payload.minWaterline,
        maxWaterline:payload.maxWaterline,
        tolerance:payload.tolerance,
        maxIterations:payload.maxIterations,
        include:includeHydro
      });
    }else{
      throw new Error(`Unknown hydro worker request: ${type}`);
    }
    self.postMessage({id,ok:true,result});
  }catch(error){
    self.postMessage({id,ok:false,error:String(error?.message||error)});
  }
};
