import {prepareHydroModel,solvePreparedWaterlineForVolume} from "./hydrostatics.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";
import {createHydroInclude} from "./hydro-selection.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";
import {attitudeMatrix,transformPoint,transformedModelDocument} from "../model/transforms.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";

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
  // Signed righting arm in the vessel's roll convention:
  // GZ is odd in heel for a laterally symmetric hull, whereas the
  // stabilizing magnitude is |GZ| on either side.
  const gz=heel===0?0:-signedLever;
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
  const start=Number(minHeel),end=Number(maxHeel),increment=Number(step);
  if(![start,end,increment].every(Number.isFinite)||!(increment>0)||!(end>=start))
    throw new Error("GZ curve requires finite ordered heel limits and a positive step");
  if((end-start)/increment>360)throw new Error("GZ curve exceeds 361 sample limit");
  const values=[];
  for(let heel=start;heel<=end+increment*1e-9;heel+=increment){
    values.push(gzAtHeel(modelDocument,{
      heelDeg:Number(heel.toFixed(10)),
      targetVolume,kg,density,tolerance,maxIterations,include
    }));
  }
  return values;
}


export function gzMetrics(curve){
  const points=(curve||[])
    .map(point=>({heelDeg:Number(point.heelDeg),gz:Number(point.gz),rightingMoment:Number(point.rightingMoment)}))
    .filter(point=>Number.isFinite(point.heelDeg)&&Number.isFinite(point.gz))
    .sort((a,b)=>a.heelDeg-b.heelDeg);
  if(!points.length)return {valid:false,reason:"No finite GZ points"};

  const maxPoint=points.reduce((best,point)=>point.gz>best.gz?point:best,points[0]);
  const minPoint=points.reduce((best,point)=>point.gz<best.gz?point:best,points[0]);
  const positive=points.filter(point=>point.heelDeg>=0);
  let areaPositiveMrad=0;
  for(let i=1;i<positive.length;i++){
    const a=positive[i-1],b=positive[i];
    const dphi=(b.heelDeg-a.heelDeg)*Math.PI/180;
    areaPositiveMrad+=Math.max(0,(Math.max(a.gz,0)+Math.max(b.gz,0))*.5*dphi);
  }
  const firstPositive=positive.find(point=>point.heelDeg>0&&Math.abs(point.gz)>1e-12);
  const initialGmEstimate=firstPositive
    ?firstPositive.gz/Math.sin(firstPositive.heelDeg*Math.PI/180)
    :null;
  const positiveRange=positive.filter(point=>point.gz>0);

  return {
    valid:true,
    maxGz:maxPoint.gz,
    angleAtMaxGz:maxPoint.heelDeg,
    minGz:minPoint.gz,
    angleAtMinGz:minPoint.heelDeg,
    areaPositiveMrad,
    initialGmEstimate:Number.isFinite(initialGmEstimate)?initialGmEstimate:null,
    positiveHeelMin:positiveRange.length?positiveRange[0].heelDeg:null,
    positiveHeelMax:positiveRange.length?positiveRange[positiveRange.length-1].heelDeg:null,
    samples:points.length
  };
}
