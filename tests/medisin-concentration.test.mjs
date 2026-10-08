import test from "node:test";
import assert from "node:assert/strict";
import {medisinConcentrations,medisinSolutionVolume,CONCENTRATION_UNITS} from "../src/diverse/medisin-concentration.js";
test("1 g in 1 L yields 1 mg/mL and 1000 mcg/mL",()=>{
 const x=medisinConcentrations({amount:1,amountUnit:"g",volume:1,volumeUnit:"L"});
 assert.equal(x.concentrations["mg/mL"],1);
 assert.equal(x.concentrations["mcg/mL"],1000);
 assert.equal(x.concentrations["g/L"],1);
 assert.equal(x.concentrations["mol/L"],null);
});
test("molecular weight enables molar conversion",()=>{
 const x=medisinConcentrations({amount:18,amountUnit:"mg",volume:1,volumeUnit:"L",molecularWeight:18});
 assert.ok(Math.abs(x.concentrations["mmol/L"]-1)<1e-12);
});
test("1 mmol/L converts to 1000 umol/L without molecular weight",()=>{
 const x=medisinConcentrations({amount:1,amountUnit:"mmol",volume:1,volumeUnit:"L"});
 assert.equal(x.concentrations["umol/L"],1000);
 assert.equal(x.concentrations["mg/mL"],null);
});
test("solution volume is a pure mass balance",()=>{
 const x=medisinSolutionVolume({totalAmount:10,totalUnit:"mg",diluentVolume:2,diluentUnit:"mL",targetAmount:1,targetUnit:"mg"});
 assert.ok(Math.abs(x.volumeML-.2)<1e-12);
 assert.equal(x.withinMix,true);
});
test("unsupported dimensions and invalid values fail safely",()=>{
 assert.throws(()=>medisinSolutionVolume({totalAmount:10,totalUnit:"mg",diluentVolume:2,diluentUnit:"mL",targetAmount:1,targetUnit:"mmol"}),/Molekylvekt/);
 assert.throws(()=>medisinConcentrations({amount:0,amountUnit:"mg",volume:1,volumeUnit:"mL"}));
 assert.throws(()=>medisinConcentrations({amount:1,amountUnit:"IU",volume:1,volumeUnit:"mL"}));
 assert.equal(CONCENTRATION_UNITS.length,10);
});