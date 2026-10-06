import {analyzeModelDocument} from "../hydro/hydrostatics.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
import {analyzeModelDiagnostics} from "../model/mesh-diagnostics.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
import {parseSTL} from "../model/parsers/stl.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
import {parse3MF} from "../model/parsers/three-mf.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";

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

function multiplyMatrix(a,b){
  const out=new Array(16).fill(0);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++){
    for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];
  }
  return out;
}

export function attitudeMatrix({heel=0,trim=0,yaw=0}={}){
  const x=Number(heel||0)*Math.PI/180;
  const y=Number(trim||0)*Math.PI/180;
  const z=Number(yaw||0)*Math.PI/180;
  const cx=Math.cos(x),sx=Math.sin(x);
  const cy=Math.cos(y),sy=Math.sin(y);
  const cz=Math.cos(z),sz=Math.sin(z);

  const rx=[1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1];
  const ry=[cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1];
  const rz=[cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1];
  return multiplyMatrix(multiplyMatrix(rz,ry),rx);
}

export function transformedModelDocument(modelDocument,attitude={}){
  const global=attitudeMatrix(attitude);
  return {
    ...modelDocument,
    components:(modelDocument.components||[]).map(component=>({
      ...component,
      transform:multiplyMatrix(global,component.transform||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])
    }))
  };
}

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
