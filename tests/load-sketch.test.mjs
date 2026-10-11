import test from "node:test";
import assert from "node:assert/strict";
import {areaLoadsFromLines,combineHullLoading} from "../src/hydro/hull-loading.js";
import {pointWeightsFromLines} from "../src/hydro/point-loads.js";
import {planBounds,planPixelToMeters,planMetersToPixel,sketchAreaLoad,sketchPointMass,
  areaLoadLine,pointMassLine,appendSketchLine} from "../src/engineering/load-sketch-core.js";

const bounds={min:[-5,-2,0],max:[5,2,3]};
test("sketch plan matches hull world X/Y, including upward positive Y",()=>{
 assert.deepEqual(planBounds(bounds),{x0:-5,x1:5,y0:-2,y1:2});
 assert.deepEqual(planPixelToMeters(0,0,bounds),{x:-5,y:2});
 assert.deepEqual(planPixelToMeters(600,300,bounds),{x:5,y:-2});
 assert.deepEqual(planPixelToMeters(300,150,bounds),{x:0,y:0});
 const pixel=planMetersToPixel(2.5,-1,bounds);
 assert.ok(Math.abs(pixel.x-450)<1e-12);
 assert.ok(Math.abs(pixel.y-225)<1e-12);
 assert.deepEqual(planPixelToMeters(pixel.x,pixel.y,bounds),{x:2.5,y:-1});
 assert.deepEqual(planPixelToMeters(-50,500,bounds),{x:-5,y:-2});
});

test("draw area box reversed direction preserves validated density, mass and z",()=>{
 const load=sketchAreaLoad({x:450,y:225},{x:150,y:75},bounds,"0.25","1.5");
 assert.ok(Math.abs(load.x0+2.5)<1e-12);
 assert.ok(Math.abs(load.x1-2.5)<1e-12);
 assert.ok(Math.abs(load.y0+1)<1e-12);
 assert.ok(Math.abs(load.y1-1)<1e-12);
 assert.equal(load.areaM2,10);
 assert.equal(load.massTonnes,2.5);
 const line=areaLoadLine(load);
 assert.match(line,/, 1\.5$/);
 assert.deepEqual(areaLoadsFromLines(line)[0].z,1.5);
 const summary=combineHullLoading({hullMassTonnes:20,hullCG:[0,0,0],areaLoads:areaLoadsFromLines(line)});
 assert.equal(summary.totalMassTonnes,22.5);
 assert.ok(Math.abs(summary.centerOfGravity[2]-2.5*1.5/22.5)<1e-12);
});

test("placing point mass adds correct height and supports signed removal",()=>{
 const load=sketchPointMass({x:450,y:225},bounds,-2,3);
 assert.deepEqual(load,{massTonnes:-2,x:2.5,y:-1,z:3});
 const line=pointMassLine(load);
 assert.equal(pointWeightsFromLines(line)[0].massTonnes,-2);
 assert.equal(pointWeightsFromLines(line)[0].z,3);
});

test("sketch does not write tiny boxes, blank heights, zero point masses, or invalid hull bounds",()=>{
 assert.throws(()=>sketchAreaLoad({x:100,y:100},{x:100.1,y:105},bounds,.1,1),/larger/);
 assert.throws(()=>sketchAreaLoad({x:100,y:100},{x:200,y:205},bounds,.1,""),/required/);
 assert.throws(()=>sketchAreaLoad({x:100,y:100},{x:200,y:205},bounds,0,1),/positive/);
 assert.throws(()=>sketchPointMass({x:100,y:100},bounds,0,1),/nonzero/);
 assert.throws(()=>sketchPointMass({x:100,y:100},bounds,2,""),/required/);
 assert.throws(()=>planBounds({min:[0,0],max:[0,4]}),/positive X and Y/);
 assert.throws(()=>planBounds({min:[0,0],max:[1,Infinity]}),/positive X and Y/);
});
test("existing manually entered rows and comments are retained on append",()=>{
 assert.equal(appendSketchLine("# existing\n1, 2, 0, 1","2, 3, 0, 2"),
   "# existing\n1, 2, 0, 1\n2, 3, 0, 2");
 assert.equal(appendSketchLine("","1, 2, 3, 4, 5, 6"),"1, 2, 3, 4, 5, 6");
 assert.equal(appendSketchLine("1, 2\n","3, 4"),"1, 2\n3, 4");
});
