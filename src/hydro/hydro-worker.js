import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";
import {createHydroInclude} from "./hydro-selection.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";
import {gzCurve} from "./gz.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";

let modelDocument=null;

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
      result=analyzeModelDocument(modelDocument,payload.waterline,{include:createHydroInclude(modelDocument)});
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
