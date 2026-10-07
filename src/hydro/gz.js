import {prepareHydroModel,solvePreparedWaterlineForVolume} from "./hydrostatics.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";
import {createHydroInclude} from "./hydro-selection.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";
import {attitudeMatrix,transformPoint,transformedModelDocument} from "../model/transforms.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";

function zBounds(prepared){
  let min=Infinity,max=-Infinity;
  for(const component of prepared?.components||[]){
    const positions=component.geometry?.positions||[];
    for(let i=2;i<positions.length;i+=3){
      min=Math.min(min,positions[i]);
      max=Math.max(max,positions[i]);
    }
  }
  if(!Number.isFinite(min)||!Number.isFinite(max))return {min:0,max:1};
  const pad=Math.max(1e-6,(max-min)*.02);
  return {min:min-pad,max:max+pad};
}

export function gzAtHeel(modelDocument,{
  heelDeg,
  targetVolume,
  kg,
  density=1025,
  tolerance=1e-9,
  maxIterations=60,
  include=createHydroInclude(modelDocument)
}){
  const heel=Number(heelDeg)||0;
  const volume=Number(targetVolume);
  const kgValue=Number(kg);
  if(!(volume>0))throw new Error("targetVolume must be positive");
  if(!Number.isFinite(kgValue))throw new Error("KG must be finite");

  const transformed=transformedModelDocument(modelDocument,{heel});
  const prepared=prepareHydroModel(transformed,{include});
  const bounds=zBounds(prepared);
  const solved=solvePreparedWaterlineForVolume(prepared,volume,{
    minWaterline:bounds.min,
    maxWaterline:bounds.max,
    tolerance,
    maxIterations
  });

  const rotation=attitudeMatrix({heel});
  const centerOfGravity=transformPoint(rotation,[0,0,kgValue]);
  const centerOfBuoyancy=solved.result.centerOfBuoyancy;
  const signedLever=centerOfBuoyancy[1]-centerOfGravity[1];
  const gz=heel===0?0:-Math.sign(heel)*signedLever;
  const displacementMass=volume*Number(density||1025);

  return {
    heelDeg:heel,
    waterline:solved.waterline,
    volume:solved.result.volume,
    centerOfBuoyancy,
    centerOfGravity,
    signedLever,
    gz,
    displacementMass,
    rightingMoment:displacementMass*9.80665*gz,
    iterations:solved.iterations
  };
}

export function gzCurve(modelDocument,{
  targetVolume,
  kg,
  density=1025,
  minHeel=-30,
  maxHeel=30,
  step=5,
  tolerance=1e-9,
  maxIterations=60,
  include=createHydroInclude(modelDocument)
}={}){
  const start=Number(minHeel),end=Number(maxHeel),increment=Math.abs(Number(step)||5);
  if(!(end>=start))throw new Error("maxHeel must be >= minHeel");
  const values=[];
  for(let heel=start;heel<=end+increment*1e-9;heel+=increment){
    values.push(gzAtHeel(modelDocument,{
      heelDeg:Number(heel.toFixed(10)),
      targetVolume,kg,density,tolerance,maxIterations,include
    }));
  }
  return values;
}
