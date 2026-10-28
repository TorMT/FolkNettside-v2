import {prepareHydroModel,solvePreparedWaterlineForVolume} from "./hydrostatics.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";
import {createHydroInclude} from "./hydro-selection.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";
import {attitudeMatrix,transformPoint,transformedModelDocument} from "../model/transforms.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";

function preparedZBounds(prepared){
  let min=Infinity,max=-Infinity;
  for(const component of prepared?.components||[]){
    const positions=component.geometry?.positions||[];
    for(let i=2;i<positions.length;i+=3){
      min=Math.min(min,positions[i]);
      max=Math.max(max,positions[i]);
    }
  }
  if(!Number.isFinite(min)||!Number.isFinite(max))return {min:0,max:1};
  const span=Math.max(1e-6,max-min);
  return {min:min-span*.02,max:max+span*.02};
}

/**
 * Constant-displacement hydrostatics at a prescribed vessel attitude.
 *
 * Coordinates follow the Engineering convention:
 * x = longitudinal/surge, y = transverse/sway, z = vertical.
 * The returned raw levers are CB-CG in the world frame. With buoyancy acting
 * vertically upward, roll and pitch restoring moments are:
 *   Mx =  W * (CB_y-CG_y)
 *   My = -W * (CB_x-CG_x)
 */
export function attitudeHydro(modelDocument,{
  heelDeg=0,
  trimDeg=0,
  yawDeg=0,
  targetVolume,
  centerOfGravity=[0,0,0],
  density=1025,
  tolerance=1e-9,
  maxIterations=60,
  include=createHydroInclude(modelDocument)
}={}){
  const volume=Number(targetVolume);
  if(!(volume>0))throw new Error("targetVolume must be positive");

  const cg=(centerOfGravity||[]).map(Number);
  if(cg.length!==3||!cg.every(Number.isFinite)){
    throw new Error("centerOfGravity must contain three finite coordinates");
  }

  const attitude={
    heel:Number(heelDeg)||0,
    trim:Number(trimDeg)||0,
    yaw:Number(yawDeg)||0
  };
  const transformed=transformedModelDocument(modelDocument,attitude);
  const prepared=prepareHydroModel(transformed,{include});
  const bounds=preparedZBounds(prepared);
  const solved=solvePreparedWaterlineForVolume(prepared,volume,{
    minWaterline:bounds.min,
    maxWaterline:bounds.max,
    tolerance,
    maxIterations
  });

  const rotation=attitudeMatrix(attitude);
  const cgWorld=transformPoint(rotation,cg);
  const cbWorld=solved.result.centerOfBuoyancy;
  const lever=[
    cbWorld[0]-cgWorld[0],
    cbWorld[1]-cgWorld[1],
    cbWorld[2]-cgWorld[2]
  ];
  const displacementMass=volume*Number(density||1025);
  const weight=displacementMass*9.80665;
  const restoringMoment=[
    weight*lever[1],
    -weight*lever[0],
    0
  ];

  return {
    heelDeg:attitude.heel,
    trimDeg:attitude.trim,
    yawDeg:attitude.yaw,
    waterline:solved.waterline,
    volume:solved.result.volume,
    centerOfBuoyancy:cbWorld,
    centerOfGravity:cgWorld,
    lever,
    rollLever:lever[1],
    pitchLever:-lever[0],
    displacementMass,
    restoringMoment,
    rollMoment:restoringMoment[0],
    pitchMoment:restoringMoment[1],
    iterations:solved.iterations,
    hydro:solved.result
  };
}

export function attitudeCurve(modelDocument,{
  axis="heel",
  start=-10,
  end=10,
  step=2,
  ...options
}={}){
  if(!["heel","trim"].includes(axis))throw new Error("axis must be heel or trim");
  const first=Number(start),last=Number(end),increment=Number(step);
  if(![first,last,increment].every(Number.isFinite)||!(increment>0)||!(last>=first))
    throw new Error("Attitude curve requires finite ordered angles and a positive step");
  if((last-first)/increment>360)throw new Error("Attitude curve exceeds 361 sample limit");
  const values=[];
  for(let angle=first;angle<=last+increment*1e-9;angle+=increment){
    values.push(attitudeHydro(modelDocument,{
      ...options,
      heelDeg:axis==="heel"?Number(angle.toFixed(10)):(options.heelDeg||0),
      trimDeg:axis==="trim"?Number(angle.toFixed(10)):(options.trimDeg||0)
    }));
  }
  return values;
}


export function solveAttitudeEquilibrium(modelDocument,{
  axis="trim",
  minAngle=-15,
  maxAngle=15,
  angleTolerance=1e-5,
  leverTolerance=1e-7,
  maxIterations=50,
  ...options
}={}){
  if(!["heel","trim"].includes(axis))throw new Error("axis must be heel or trim");
  let low=Number(minAngle),high=Number(maxAngle);
  if(![low,high,angleTolerance,leverTolerance].every(Number.isFinite)||!(high>low)||
     !(angleTolerance>0)||!(leverTolerance>0))
    throw new Error("Equilibrium solver requires finite bounds and positive tolerances");
  if(!Number.isSafeInteger(maxIterations)||maxIterations<1||maxIterations>500)
    throw new Error("Equilibrium solver maxIterations must be an integer between 1 and 500");

  const evaluate=angle=>{
    const result=attitudeHydro(modelDocument,{
      ...options,
      heelDeg:axis==="heel"?angle:(options.heelDeg||0),
      trimDeg:axis==="trim"?angle:(options.trimDeg||0)
    });
    return {
      angle,
      residual:axis==="heel"?result.rollLever:result.pitchLever,
      result
    };
  };

  let a=evaluate(low),b=evaluate(high);
  if(Math.abs(a.residual)<=leverTolerance)return {...a.result,axis,equilibriumAngle:a.angle,residual:a.residual,equilibriumIterations:0};
  if(Math.abs(b.residual)<=leverTolerance)return {...b.result,axis,equilibriumAngle:b.angle,residual:b.residual,equilibriumIterations:0};
  if(Math.sign(a.residual)===Math.sign(b.residual)){
    const error=new Error(
      `No ${axis} equilibrium bracketed between ${low}° and ${high}°; residuals are ${a.residual} m and ${b.residual} m`
    );
    error.code="EQUILIBRIUM_NOT_BRACKETED";
    error.low=a;
    error.high=b;
    throw error;
  }

  let mid=null;
  for(let iteration=1;iteration<=maxIterations;iteration++){
    const angle=(low+high)/2;
    mid=evaluate(angle);
    if(Math.abs(mid.residual)<=leverTolerance){
      return {
        ...mid.result,
        axis,
        equilibriumAngle:angle,
        residual:mid.residual,
        equilibriumIterations:iteration
      };
    }
    if(Math.sign(mid.residual)===Math.sign(a.residual)){
      low=angle;
      a=mid;
    }else{
      high=angle;
      b=mid;
    }
  }
  const failure=new Error("Hydro "+axis+" equilibrium did not converge to lever tolerance "+
    leverTolerance+" m in "+maxIterations+" iterations; residual "+mid.residual+" m");
  failure.code="EQUILIBRIUM_NOT_CONVERGED";
  failure.residual=mid.residual;
  throw failure;
}
