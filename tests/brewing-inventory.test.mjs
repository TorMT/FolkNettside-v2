import test from "node:test";
import assert from "node:assert/strict";
import {validateIngredient,parseIngredientArchive} from "../src/diverse/brewing/inventory.js";
test("Brewing local ingredient validation",()=>{
 assert.deepEqual(validateIngredient({name:"Pilsner malt",quantity:4.5,unit:"kg"}),{name:"Pilsner malt",quantity:4.5,unit:"kg"});
 assert.throws(()=>validateIngredient({name:"Malt",quantity:-1,unit:"kg"}),/Quantity/);
 assert.throws(()=>validateIngredient({name:"Malt",quantity:2,unit:"invalid"}),/unit/);
});
test("Brewing inventory import rejects oversized and malformed data",()=>{
 assert.deepEqual(parseIngredientArchive({schemaVersion:1,items:[]}),[]);
 assert.throws(()=>parseIngredientArchive({schemaVersion:2,items:[]}),/Invalid/);
 assert.throws(()=>parseIngredientArchive({schemaVersion:1,items:new Array(501).fill({name:"x",quantity:1,unit:"g"})}),/Invalid/);
});
