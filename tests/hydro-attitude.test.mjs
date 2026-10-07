import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {analyzeModelDocument} from "../src/hydro/hydrostatics.js";
import {attitudeCurve,attitudeHydro,solveAttitudeEquilibrium} from "../src/hydro/attitude.js";

const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

function barge(){
  return {
    unitScaleToMeters:1,
    components:[{
      id:"hull",name:"Hull",
      geometry:boxMesh({L:10,B:4,H:3}),
      metadata:{semantic:{role:"hull",hydro:{include:true}}}
    }]
  };
}

test("attitude hydro preserves target displacement and zero upright moments",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const result=attitudeHydro(model,{
    targetVolume:upright.volume,
    centerOfGravity:[0,0,.5]
  });
  near(result.volume,upright.volume,1e-7);
  near(result.waterline,1,1e-7);
  near(result.rollLever,0,1e-10);
  near(result.pitchLever,0,1e-10);
  near(result.rollMoment,0,1e-6);
  near(result.pitchMoment,0,1e-6);
});

test("heel attitude produces opposite raw transverse levers at plus/minus angle",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const positive=attitudeHydro(model,{
    heelDeg:8,targetVolume:upright.volume,centerOfGravity:[0,0,.5]
  });
  const negative=attitudeHydro(model,{
    heelDeg:-8,targetVolume:upright.volume,centerOfGravity:[0,0,.5]
  });
  near(positive.volume,upright.volume,1e-6);
  near(negative.volume,upright.volume,1e-6);
  near(positive.rollLever,-negative.rollLever,2e-5);
  near(positive.rollMoment,-negative.rollMoment,5);
});

test("trim attitude produces opposite longitudinal levers at plus/minus angle",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const bowUp=attitudeHydro(model,{
    trimDeg:4,targetVolume:upright.volume,centerOfGravity:[0,0,.5]
  });
  const bowDown=attitudeHydro(model,{
    trimDeg:-4,targetVolume:upright.volume,centerOfGravity:[0,0,.5]
  });
  near(bowUp.volume,upright.volume,1e-6);
  near(bowDown.volume,upright.volume,1e-6);
  near(bowUp.pitchLever,-bowDown.pitchLever,2e-5);
  near(bowUp.pitchMoment,-bowDown.pitchMoment,5);
});

test("attitude curve supports both heel and trim axes",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const common={targetVolume:upright.volume,centerOfGravity:[0,0,.5],start:-4,end:4,step:4};
  const heel=attitudeCurve(model,{axis:"heel",...common});
  const trim=attitudeCurve(model,{axis:"trim",...common});
  assert.deepEqual(heel.map(p=>p.heelDeg),[-4,0,4]);
  assert.deepEqual(trim.map(p=>p.trimDeg),[-4,0,4]);
  for(const point of [...heel,...trim])near(point.volume,upright.volume,1e-6);
});


test("trim equilibrium solver finds zero pitch lever for shifted LCG",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const result=solveAttitudeEquilibrium(model,{
    axis:"trim",
    minAngle:-12,
    maxAngle:12,
    targetVolume:upright.volume,
    centerOfGravity:[.35,0,.5],
    leverTolerance:1e-6
  });
  assert.ok(result.equilibriumAngle>=-12&&result.equilibriumAngle<=12);
  assert.ok(Math.abs(result.residual)<=1e-6);
  near(result.volume,upright.volume,1e-6);
});

test("heel equilibrium solver finds zero roll lever for shifted TCG",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const result=solveAttitudeEquilibrium(model,{
    axis:"heel",
    minAngle:-12,
    maxAngle:12,
    targetVolume:upright.volume,
    centerOfGravity:[0,.10,.5],
    leverTolerance:1e-6
  });
  assert.ok(result.equilibriumAngle>=-12&&result.equilibriumAngle<=12);
  assert.ok(Math.abs(result.residual)<=1e-6);
  near(result.volume,upright.volume,1e-6);
});

test("equilibrium solver fails explicitly when requested bracket has no root",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  assert.throws(
    ()=>solveAttitudeEquilibrium(model,{
      axis:"trim",
      minAngle:0,
      maxAngle:1,
      targetVolume:upright.volume,
      centerOfGravity:[2,0,.5]
    }),
    error=>error?.code==="EQUILIBRIUM_NOT_BRACKETED"
  );
});
