import {analyzeModelDocument} from "../hydro/hydrostatics.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {createHydroInclude} from "../hydro/hydro-selection.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {validateHydroModel} from "../model/hull-surface-validator.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {analyzeModelDiagnostics} from "../model/mesh-diagnostics.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {parseSTL} from "../model/parsers/stl.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {parse3MF} from "../model/parsers/three-mf.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {attitudeMatrix,transformedModelDocument} from "../model/transforms.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";

export function modelFileKind(name){
  const ext=String(name||"").split(".").pop()?.toLowerCase();
  return ext==="stl"?"STL":ext==="3mf"?"3MF":null;
}

export async function parseModelBuffer(buffer,name="model.stl"){
  const kind=modelFileKind(name);
  if(kind==="STL")return parseSTL(buffer,name);
  if(kind==="3MF")return parse3MF(buffer,name);
  throw new Error("Only STL and 3MF are supported by the v2 model inspector");
}

export function modelHydroSummary(modelDocument,waterline=0,density=1025){
  const diagnostics=analyzeModelDiagnostics(modelDocument);
  const include=createHydroInclude(modelDocument);
  const geometryValidation=validateHydroModel(modelDocument,{include});
  if(!geometryValidation.passed){
    throw new Error("Hull preflight blocked: "+geometryValidation.errors.slice(0,5).join("; "));
  }
  const hydro=analyzeModelDocument(modelDocument,Number(waterline)||0,{include});
  const fullWaterline=diagnostics.bounds.max[2]+Math.max(1e-6,diagnostics.bounds.size[2]*.02);
  const full=analyzeModelDocument(modelDocument,fullWaterline,{include});
  return {
    geometryValidation,
    diagnostics,
    waterline:Number(waterline)||0,
    volume:hydro.volume,
    displacementKg:hydro.volume*Number(density||1025),
    centerOfBuoyancy:hydro.centerOfBuoyancy,
    waterplane:hydro.waterplane,
    solidVolume:full.volume,
    solidCentroid:full.centerOfBuoyancy
  };
}

export {attitudeMatrix,transformedModelDocument};

export function modelHydroSummaryAtAttitude(modelDocument,waterline=0,density=1025,attitude={}){
  const transformed=transformedModelDocument(modelDocument,attitude);
  return {
    ...modelHydroSummary(transformed,waterline,density),
    attitude:{
      heel:Number(attitude.heel)||0,
      trim:Number(attitude.trim)||0,
      yaw:Number(attitude.yaw)||0
    }
  };
}
