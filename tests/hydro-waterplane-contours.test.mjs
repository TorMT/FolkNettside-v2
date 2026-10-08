import test from "node:test";
import assert from "node:assert/strict";
import {integrateWaterplaneContours,stitchWaterplaneContours} from "../src/hydro/waterplane-contours.js";
import {analyzeHydrostatics} from "../src/hydro/hydrostatics.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {validateHydroGeometry} from "../src/model/hull-surface-validator.js";

const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`Expected ${a} ≈ ${b} (tol ${tol})`);
function square(x0,y0,x1,y1){
  return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
}
function segments(loop,reverse=false){
  const p=reverse?loop.slice().reverse():loop;
  return p.map((v,i)=>[v,p[(i+1)%p.length]]);
}
function hollowBox({outerL=10,outerB=6,innerL=2,innerB=2,height=2}={}){
  const o=square(-outerL/2,-outerB/2,outerL/2,outerB/2);
  const h=square(-innerL/2,-innerB/2,innerL/2,innerB/2);
  const positions=[],indices=[];
  function quad(points){
    const base=positions.length/3;
    for(const [x,y,z] of points)positions.push(x,y,z);
    indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  for(let i=0;i<4;i++){
    const j=(i+1)%4;
    const ob0=[...o[i],0],ob1=[...o[j],0],ot0=[...o[i],height],ot1=[...o[j],height];
    const ib0=[...h[i],0],ib1=[...h[j],0],it0=[...h[i],height],it1=[...h[j],height];
    quad([ob0,ob1,ot1,ot0]);
    quad([ib0,it0,it1,ib1]);
    quad([ot0,ot1,it1,it0]);
    quad([ob0,ib0,ib1,ob1]);
  }
  return {positions,indices};
}

test("nested waterplane subtracts flooded moonpool independent of loop winding",()=>{
 const edges=[...segments(square(-5,-3,5,3),true),...segments(square(-1,-1,1,1))].reverse();
 const p=integrateWaterplaneContours(edges);
 near(p.area,56);
 near(p.centroid[0],0);near(p.centroid[1],0);
 near(p.ixx,(10*6**3-2*2**3)/12);
 near(p.iyy,(6*10**3-2*2**3)/12);
 near(p.ixy,0);
 assert.equal(p.holeContours,1);
 assert.equal(p.outerContours,1);
 assert.equal(p.loops.length,2);
});
test("island inside flooded hole follows even-odd depth",()=>{
 const p=integrateWaterplaneContours([
  ...segments(square(-5,-3,5,3)),
  ...segments(square(-1,-1,1,1),true),
  ...segments(square(-.5,-.5,.5,.5))
 ]);
 near(p.area,57);
 assert.equal(p.outerContours,2);assert.equal(p.holeContours,1);
});
test("two spatially separate waterplane loops add area without any holes",()=>{
 const p=integrateWaterplaneContours([
   ...segments(square(-5,-1,-3,1)),...segments(square(3,-1,5,1),true)
 ]);
 near(p.area,8);near(p.centroid[0],0);
 assert.equal(p.holeContours,0);
 assert.equal(p.outerContours,2);
});
test("translated plane retains small moments without catastrophic cancellation",()=>{
 const x=1e6,y=-2e6;
 const p=integrateWaterplaneContours(segments(square(x-5,y-3,x+5,y+3)));
 near(p.area,60);near(p.centroid[0],x,1e-6);near(p.centroid[1],y,1e-6);
 near(p.ixx,180);near(p.iyy,500);
});
test("open, duplicate and branched cross sections are rejected rather than shown as valid waterplane",()=>{
 assert.throws(()=>stitchWaterplaneContours(segments(square(-1,-1,1,1)).slice(0,3)),/not closed/);
 const loop=segments(square(-1,-1,1,1));
 assert.throws(()=>stitchWaterplaneContours([...loop,loop[0]]),/duplicate/);
 assert.throws(()=>stitchWaterplaneContours([...loop,[[1,1],[3,1]]]),/branched|not closed/);
});
test("true 3D watertight rectangular moonpool hull returns analytic displacement and waterplane moments",()=>{
 const shell=hollowBox();
 const validation=validateHydroGeometry(shell);
 assert.equal(validation.passed,true,JSON.stringify(validation.errors));
 const hydro=analyzeHydrostatics(shell,1);
 near(hydro.volume,56);
 near(hydro.centerOfBuoyancy[0],0);
 near(hydro.centerOfBuoyancy[1],0);
 near(hydro.centerOfBuoyancy[2],.5);
 near(hydro.waterplane.area,56);
 near(hydro.waterplane.ixx,(10*6**3-2*2**3)/12);
 near(hydro.waterplane.iyy,(6*10**3-2*2**3)/12);
 assert.equal(hydro.waterplane.holeContours,1);
 const document={unitScaleToMeters:1,components:[
  {id:"moonpool",name:"Rectangular moonpool",geometry:shell,metadata:{hydro:true}}
 ]};
 const viaService=executeHydroRequest(document,"analyze",{waterline:1});
 near(viaService.volume,56);
 near(viaService.waterplane.area,56);
 assert.equal(viaService.waterplane.holeContours,1);
 assert.equal(viaService.waterplane.outerContours,1);
 const curve=executeHydroRequest(document,"curve",{minWaterline:.25,maxWaterline:1.75,samples:4});
 for(const row of curve){
   near(row.waterplane.area,56);
   near(row.volume,56*row.waterline,1e-7);
 }
});
