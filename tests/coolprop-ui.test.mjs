import test from "node:test";
import assert from "node:assert/strict";
import {coolPropToolHTML} from "../src/tools/coolprop-tool.js";

test("CoolProp compact workspace retains all functional controls",()=>{
  const html=coolPropToolHTML({});
  for(const id of [
    "cp-fluid","cp-pressure-unit","cp-temperature-unit","cp-energy-unit","cp-entropy-unit","cp-book-basis",
    "cp-single-i1","cp-single-v1","cp-single-i2","cp-single-v2","cp-single-run",
    "cp-help-open","cp-export-csv","cp-export-json"
  ]){
    assert.match(html,new RegExp(`id="${id}"`),id+" missing");
  }
  assert.match(html,/coolprop-verified-badge/);
  assert.match(html,/coolprop-workspace-head/);
  assert.doesNotMatch(html,/tool-parity-banner/);
});

test("CoolProp workspace tabs remain complete after visual cleanup",()=>{
  const html=coolPropToolHTML({tab:"process"});
  for(const tab of ["single","batch","process","reference","explore"]){
    assert.match(html,new RegExp(`data-cp-tab="${tab}"`));
  }
  assert.match(html,/data-cp-tab="process" class="active"/);
});


test("CoolProp reference-table workspace exposes mapped course tables",()=>{
  const ammonia=coolPropToolHTML({fluid:"Ammonia",tab:"reference"});
  assert.match(ammonia,/id="cp-reference-table"/);
  assert.match(ammonia,/A-13/);
  assert.match(ammonia,/A-14/);
  assert.match(ammonia,/A-15/);
  assert.match(ammonia,/id="cp-reference-run"/);

  const water=coolPropToolHTML({fluid:"Water",tab:"reference"});
  for(const table of ["A-2","A-3","A-4","A-5"])assert.match(water,new RegExp(table));

  const r134a=coolPropToolHTML({fluid:"R134a",tab:"reference"});
  for(const table of ["A-10","A-11","A-12"])assert.match(r134a,new RegExp(table));
});
