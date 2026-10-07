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
  for(const tab of ["single","batch","process","explore"]){
    assert.match(html,new RegExp(`data-cp-tab="${tab}"`));
  }
  assert.match(html,/data-cp-tab="process" class="active"/);
});
