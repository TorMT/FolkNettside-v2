import test from "node:test";
import assert from "node:assert/strict";
import {combineHullLoading,normaliseAreaLoad} from "../src/hydro/hull-loading.js";
import {combinePointWeights} from "../src/hydro/point-loads.js";

const area={densityTonnesPerM2:.5,x0:0,x1:2,y0:-1,y1:1,z:3};
test("distributed mass load uses specified elevation in vertical CG moments",()=>{
 const result=combineHullLoading({hullMassTonnes:10,hullCG:[0,0,1],areaLoads:[area]});
 assert.equal(result.areaMassTonnes,2);
 assert.equal(result.areaLoads[0].areaM2,4);
 assert.ok(Math.abs(result.centerOfGravity[0]-1/6)<1e-12);
 assert.equal(result.centerOfGravity[1],0);
 assert.ok(Math.abs(result.centerOfGravity[2]-16/12)<1e-12);
});
test("distributed area height and all rectangle coordinates are required; valid zeros remain valid",()=>{
 assert.equal(normaliseAreaLoad({...area,z:0}).z,0);
 for(const key of ["x0","x1","y0","y1","z"]){
   for(const missing of [null,undefined,"  "]){
     assert.throws(()=>normaliseAreaLoad({...area,[key]:missing}),/required/,key+" "+missing);
   }
 }
 assert.throws(()=>normaliseAreaLoad({...area,x0:-1e308,x1:1e308}),/numeric limits/);
 assert.throws(()=>normaliseAreaLoad({...area,densityTonnesPerM2:1e308}),/numeric limits/);
});
test("loading computations reject floating-point overflow rather than returning NaN CG",()=>{
 assert.throws(()=>combineHullLoading({hullMassTonnes:1e308,hullCG:[0,0,1e308]}),/finite/);
 assert.throws(()=>combinePointWeights({baselineMassTonnes:1e308,baselineCG:[0,0,1e308]}),/finite/);
});
test("point loading requires explicit coordinates including Z instead of silently using zero",()=>{
 const base={baselineMassTonnes:10,baselineCG:[0,0,1]};
 assert.throws(()=>combinePointWeights({...base,baselineCG:[null,0,1]}),/Baseline CG/);
 for(const missing of [null,undefined,""]){
   assert.throws(()=>combinePointWeights({...base,pointWeights:[{massTonnes:2,x:0,y:0,z:missing}]}),/requires finite/);
 }
 const valid=combinePointWeights({...base,pointWeights:[{massTonnes:2,x:0,y:0,z:0}]});
 assert.equal(valid.totalMassTonnes,12);
 assert.ok(Math.abs(valid.centerOfGravity[2]-10/12)<1e-12);
});
