import test from "node:test";
import assert from "node:assert/strict";
import {editFromState} from "../src/tools/crystal-editor-panel.js";

test("crystal editor builds atom-targeted defect edits",()=>{
  assert.deepEqual(editFromState({editMode:"vacancy",placeX:.5,placeY:.5,placeZ:.5},4),{type:"vacancy",baseIndex:4,target:[.5,.5,.5],maxDistance:.35});
  assert.deepEqual(editFromState({editMode:"dopant",manualAtom:"cr",placeX:0,placeY:0,placeZ:0},2),{type:"dopant",baseIndex:2,target:[0,0,0],maxDistance:.35,species:"Cr"});
});

test("crystal editor builds positioned manual and marker edits",()=>{
  const manual=editFromState({editMode:"manual",manualAtom:"c",placeX:.2,placeY:.3,placeZ:.4,manualRadius:.13,manualColor:"#123456"});
  assert.equal(manual.type,"manual");
  assert.equal(manual.species,"C");
  assert.deepEqual(manual.pos,[.2,.3,.4]);
  assert.equal(manual.radius,.13);
  assert.equal(manual.color,"#123456");
  assert.deepEqual(editFromState({editMode:"electron",placeX:1,placeY:2,placeZ:3}),{type:"electron",pos:[1,2,3]});
});

test("none edit mode does not mutate crystal state",()=>{
  assert.equal(editFromState({editMode:"none"}),null);
});