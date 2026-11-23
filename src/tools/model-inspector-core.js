import {analyzeModelDocument} from "../hydro/hydrostatics.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {createHydroInclude} from "../hydro/hydro-selection.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {validateHydroModel} from "../model/hull-surface-validator.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {analyzeModelDiagnostics} from "../model/mesh-diagnostics.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {parseSTL} from "../model/parsers/stl.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {parse3MF} from "../model/parsers/three-mf.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {attitudeMatrix,transformedModelDocument} from "../model/transforms.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";

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
