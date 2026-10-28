import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {createHydroInclude} from "./hydro-selection.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {validateHydroModel} from "../model/hull-surface-validator.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {auditHydroCurve} from "./numerical-audit.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {gzCurve} from "./gz.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {attitudeCurve,attitudeHydro,solveAttitudeEquilibrium} from "./attitude.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {integrateModelHullPressure} from "./pressure-integration.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";

export function executeHydroRequest(modelDocument,type,payload={}){
  if(!modelDocument)throw new Error("Hydro service has no model loaded");
  const include=createHydroInclude(modelDocument);
  const validation=validateHydroModel(modelDocument,{include});
  if(type==="validate")return validation;
  if(!validation.passed){
    throw new Error("Hydro preflight blocked: "+validation.errors.slice(0,6).join("; ")+
      (validation.errors.length>6?" (+"+(validation.errors.length-6)+" more)":""));
  }

  if(type==="analyze"){
    return analyzeModelDocument(modelDocument,payload.waterline,{include});
  }
  if(type==="pressure"){
    return integrateModelHullPressure(modelDocument,{
      waterline:payload.waterline,densityKgM3:payload.densityKgM3,
      sections:payload.sections??24,maxTriangles:payload.maxTriangles??160000,include
    });
  }
  if(type==="curve"){
    const curve=hydroCurve(modelDocument,{
      minWaterline:payload.minWaterline,
      maxWaterline:payload.maxWaterline,
      samples:payload.samples,
      include
    });
    const audit=auditHydroCurve(curve);
    if(!audit.passed)
      throw new Error("Hydro numerical consistency blocked: "+
        audit.errors.slice(0,3).join("; "));
    return curve;
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
