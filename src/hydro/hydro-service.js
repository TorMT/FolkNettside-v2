import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
import {createHydroInclude} from "./hydro-selection.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
import {gzCurve} from "./gz.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";

export function executeHydroRequest(modelDocument,type,payload={}){
  if(!modelDocument)throw new Error("Hydro service has no model loaded");
  const include=createHydroInclude(modelDocument);

  if(type==="analyze"){
    return analyzeModelDocument(modelDocument,payload.waterline,{include});
  }
  if(type==="curve"){
    return hydroCurve(modelDocument,{
      minWaterline:payload.minWaterline,
      maxWaterline:payload.maxWaterline,
      samples:payload.samples,
      include
    });
  }
  if(type==="solve"){
    return solveWaterlineForVolume(modelDocument,payload.targetVolume,{
      minWaterline:payload.minWaterline,
      maxWaterline:payload.maxWaterline,
      tolerance:payload.tolerance,
      maxIterations:payload.maxIterations,
      include
    });
  }
  if(type==="gz"){
    return gzCurve(modelDocument,{
      targetVolume:payload.targetVolume,
      kg:payload.kg,
      density:payload.density,
      minHeel:payload.minHeel,
      maxHeel:payload.maxHeel,
      step:payload.step,
      tolerance:payload.tolerance,
      maxIterations:payload.maxIterations,
      include
    });
  }
  throw new Error(`Unknown hydro request: ${type}`);
}
