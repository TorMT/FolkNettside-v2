import test from "node:test";
import assert from "node:assert/strict";
import {csvTableDisplayLimits} from "../src/viewers/csv-display-limits.js";

test("CSV table keeps small previews intact",()=>{
 assert.deepEqual(csvTableDisplayLimits(35,8),{rows:35,columns:8});
 assert.deepEqual(csvTableDisplayLimits(0,0),{rows:0,columns:0});
});
test("CSV preview caps extremely wide and tall files without changing parsed data",()=>{
 assert.deepEqual(csvTableDisplayLimits(1000000,100000),{rows:125,columns:64});
 assert.deepEqual(csvTableDisplayLimits(2000,4),{rows:1500,columns:4});
 assert.deepEqual(csvTableDisplayLimits(2000,1),{rows:1500,columns:1});
 assert.deepEqual(csvTableDisplayLimits(500,64),{rows:125,columns:64});
});
test("invalid CSV table sizes are rejected before DOM allocation",()=>{
 for(const [rows,cols] of [[-1,1],[2,-1],[Infinity,5],[0,NaN],[1.5,3]]){
   assert.throws(()=>csvTableDisplayLimits(rows,cols),RangeError);
 }
});
