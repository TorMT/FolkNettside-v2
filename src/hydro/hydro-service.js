import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
import {createHydroInclude} from "./hydro-selection.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
import {gzCurve} from "./gz.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
import {attitudeCurve,attitudeHydro,solveAttitudeEquilibrium} from "./attitude.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";

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
  if(type==="attitude"){
    return attitudeHydro(modelDocument,{...payload,include});
  }
  if(type==="attitudeCurve"){
    return attitudeCurve(modelDocument,{...payload,include});
  }
  if(type==="equilibrium"){
    return solveAttitudeEquilibrium(modelDocument,{...payload,include});
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
