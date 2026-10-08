import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {analyzeModelDocument} from "../src/hydro/hydrostatics.js";
import {gzAtHeel,gzCurve,gzMetrics} from "../src/hydro/gz.js";
import {initialStability} from "../src/hydro/stability.js";

const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

function barge({L=10,B=4,H=3}={}){
  return {
    unitScaleToMeters:1,
    components:[{
      id:"hull",name:"Hull",
      geometry:boxMesh({L,B,H}),
      metadata:{hydro:true}
    }]
  };
}

test("GZ curve preserves target displacement at every heel",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const curve=gzCurve(model,{targetVolume:upright.volume,kg:.5,minHeel:-10,maxHeel:10,step:5});
  for(const point of curve)near(point.volume,upright.volume,1e-6);
});

test("symmetric barge GZ is antisymmetric in signed geometry and restoring magnitude is symmetric",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const positive=gzAtHeel(model,{heelDeg:10,targetVolume:upright.volume,kg:.5});
  const negative=gzAtHeel(model,{heelDeg:-10,targetVolume:upright.volume,kg:.5});
  near(positive.gz,-negative.gz,2e-5);
  near(positive.rightingMoment,-negative.rightingMoment,5);
  near(positive.signedLever,-negative.signedLever,2e-5);
});

test("small-angle GZ approaches GM sin(phi) for wall-sided rectangular barge",()=>{
  const model=barge({L:10,B:4,H:3});
  const upright=analyzeModelDocument(model,1);
  const stability=initialStability(upright,{kg:.5});
  const phiDeg=1;
  const point=gzAtHeel(model,{heelDeg:phiDeg,targetVolume:upright.volume,kg:.5});
  const linear=stability.gmTransverse*Math.sin(phiDeg*Math.PI/180);
  near(point.gz,linear,6e-4);
});

test("zero heel returns zero GZ",()=>{
  const model=barge();
  const upright=analyzeModelDocument(model,1);
  const point=gzAtHeel(model,{heelDeg:0,targetVolume:upright.volume,kg:.5});
  near(point.gz,0,1e-12);
  near(point.waterline,1,1e-6);
});


test("GZ metrics summarize maximum, positive area and first-point GM estimate",()=>{
  const curve=[
    {heelDeg:-10,gz:-.20,rightingMoment:-10},
    {heelDeg:0,gz:0,rightingMoment:0},
    {heelDeg:5,gz:.10,rightingMoment:5},
    {heelDeg:10,gz:.16,rightingMoment:8},
    {heelDeg:15,gz:.12,rightingMoment:6}
  ];
  const metrics=gzMetrics(curve);
  assert.equal(metrics.valid,true);
  near(metrics.maxGz,.16);
  near(metrics.angleAtMaxGz,10);
  near(metrics.initialGmEstimate,.10/Math.sin(5*Math.PI/180),1e-12);
  const expectedArea=((0+.10)/2*5+(.10+.16)/2*5+(.16+.12)/2*5)*Math.PI/180;
  near(metrics.areaPositiveMrad,expectedArea,1e-12);
  assert.equal(metrics.positiveHeelMin,5);
  assert.equal(metrics.positiveHeelMax,15);
});

test("GZ metrics reject an empty curve cleanly",()=>{
  const metrics=gzMetrics([]);
  assert.equal(metrics.valid,false);
  assert.match(metrics.reason,/No finite GZ/i);
});
