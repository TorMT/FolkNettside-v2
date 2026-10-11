import test from "node:test";
import assert from "node:assert/strict";
import {areaLoadsFromLines,combineHullLoading} from "../src/hydro/hull-loading.js";
import {pointWeightsFromLines} from "../src/hydro/point-loads.js";
import {planBounds,planPixelToMeters,planMetersToPixel,sketchAreaLoad,sketchPointMass,
  areaLoadLine,pointMassLine,appendSketchLine,sketchDataRowIndices,updateSketchDataRow,
  moveSketchAreaLoad,moveSketchPointMass,editSketchAreaProperties,editSketchPointProperties
} from "../src/engineering/load-sketch-core.js";

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

test("editing one load preserves comments, duplicate rows and original CRLF structure",()=>{
 const input="# header\r\n1, -4, 0, 1\r\n\r\n# notes\r\n1, -4, 0, 1\r\n";
 assert.deepEqual(sketchDataRowIndices(input),[1,4]);
 const modified=updateSketchDataRow(input,1,"2, 3, 1, 4");
 assert.equal(modified,"# header\r\n1, -4, 0, 1\r\n\r\n# notes\r\n2, 3, 1, 4\r\n");
 assert.deepEqual(pointWeightsFromLines(modified).map(p=>p.massTonnes),[1,2]);
 const deleted=updateSketchDataRow(modified,0,null);
 assert.equal(deleted,"# header\r\n\r\n# notes\r\n2, 3, 1, 4\r\n");
 assert.deepEqual(pointWeightsFromLines(deleted).map(p=>p.massTonnes),[2]);
 assert.throws(()=>updateSketchDataRow(input,2,null),/no longer exists/);
 assert.throws(()=>updateSketchDataRow(input,0,"x\nmore"),/one valid data row/);
});
test("moving an area preserves exact mass, Z and dimensions, with hull-bounds clamping",()=>{
 const original=sketchAreaLoad({x:150,y:75},{x:450,y:225},bounds,.25,1.5);
 const moved=moveSketchAreaLoad(original,{x:200,y:150},{x:300,y:100},bounds);
 assert.equal(moved.densityTonnesPerM2,.25);
 assert.equal(moved.z,1.5);
 assert.equal(moved.massTonnes,original.massTonnes);
 assert.equal(moved.areaM2,original.areaM2);
 assert.ok(moved.x0>original.x0&&moved.y0>original.y0);
 const clipped=moveSketchAreaLoad(original,{x:200,y:150},{x:600,y:300},bounds);
 assert.ok(clipped.x0>=-5&&clipped.x1<=5);
 assert.ok(clipped.y0>=-2&&clipped.y1<=2);
 assert.equal(clipped.massTonnes,original.massTonnes);
 assert.throws(()=>moveSketchAreaLoad({...original,x0:-15,x1:15},{
   x:200,y:150},{x:300,y:100},bounds),/larger than/);
});
test("moving point load preserves signed mass and its height",()=>{
 const original={massTonnes:-2,x:-4,y:1,z:3};
 const moved=moveSketchPointMass(original,{x:300,y:150},bounds);
 assert.deepEqual({massTonnes:moved.massTonnes,z:moved.z},{massTonnes:-2,z:3});
 assert.equal(moved.x,0);
 assert.equal(moved.y,0);
});
test("selected load physical properties update only intended mass and vertical moment",()=>{
 const original=sketchAreaLoad({x:150,y:75},{x:450,y:225},bounds,.25,1.5);
 const edited=editSketchAreaProperties(original,".5","2.25");
 assert.equal(edited.massTonnes,5);
 assert.equal(edited.z,2.25);
 assert.equal(edited.areaM2,original.areaM2);
 assert.equal(edited.x,original.x);
 assert.equal(edited.y,original.y);
 const p=editSketchPointProperties({massTonnes:3,x:1,y:2,z:1},"-1.5","4");
 assert.deepEqual([p.massTonnes,p.x,p.y,p.z],[-1.5,1,2,4]);
 assert.throws(()=>editSketchPointProperties(p,"",1),/required/);
 assert.throws(()=>editSketchPointProperties(p,0,1),/nonzero/);
 assert.throws(()=>editSketchAreaProperties(original,"",1),/required/);
});
