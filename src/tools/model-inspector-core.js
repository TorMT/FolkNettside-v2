import {analyzeModelDocument} from "../hydro/hydrostatics.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
import {analyzeModelDiagnostics} from "../model/mesh-diagnostics.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
import {parseSTL} from "../model/parsers/stl.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
import {parse3MF} from "../model/parsers/three-mf.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
import {attitudeMatrix,transformedModelDocument} from "../model/transforms.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";

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
  const hydro=analyzeModelDocument(modelDocument,Number(waterline)||0);
  const fullWaterline=diagnostics.bounds.max[2]+Math.max(1e-6,diagnostics.bounds.size[2]*.02);
  const full=analyzeModelDocument(modelDocument,fullWaterline);
  return {
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
