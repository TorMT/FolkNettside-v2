import {performance} from "node:perf_hooks";
import {boxMesh} from "../src/hydro/fixtures.js";
import {analyzePreparedHydro,prepareHydroModel} from "../src/hydro/hydrostatics.js";

function subdividedBox({L=40,B=10,H=6,nx=40,ny=12}={}){
  // Multiple independent watertight boxes form a deterministic high-triangle benchmark
  // while retaining an exact analytical total volume.
  const components=[];
  const dx=L/nx,dy=B/ny;
  let id=0;
  for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++){
    const x=-L/2+dx*(ix+.5);
    const y=-B/2+dy*(iy+.5);
    components.push({
      id:"cell-"+(++id),
      name:"Cell "+id,
      geometry:boxMesh({L:dx,B:dy,H,origin:[x,y,0]}),
      metadata:{hydro:true}
    });
  }
  return {unitScaleToMeters:1,components};
}

const model=subdividedBox();
const t0=performance.now();
const prepared=prepareHydroModel(model,{include:c=>c.metadata?.hydro===true});
const prepMs=performance.now()-t0;

const drafts=Array.from({length:21},(_,i)=>6*i/20);
const t1=performance.now();
let checksum=0;
for(const draft of drafts){
  const result=analyzePreparedHydro(prepared,draft);
  checksum+=result.volume;
}
const analysisMs=performance.now()-t1;

if(!(checksum>0))throw new Error("hydro benchmark checksum failed");

const triangles=prepared.components.reduce((sum,item)=>sum+(item.geometry.indices?.length||0)/3,0);
console.log(JSON.stringify({
  benchmark:"hydro-prepared-curve",
  components:prepared.components.length,
  triangles,
  drafts:drafts.length,
  prepareMs:Number(prepMs.toFixed(2)),
  analysisMs:Number(analysisMs.toFixed(2)),
  msPerDraft:Number((analysisMs/drafts.length).toFixed(3))
},null,2));

// Deliberately generous: catches catastrophic regressions without depending on runner speed.
if(analysisMs>5000){
  throw new Error(`Hydro prepared benchmark exceeded 5000 ms: ${analysisMs.toFixed(1)} ms`);
}
