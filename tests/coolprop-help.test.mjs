import test from "node:test";
import assert from "node:assert/strict";
import {COOLPROP_HELP,searchCoolPropHelp} from "../src/tools/coolprop-help.js";

test("legacy CoolProp help topics are represented",()=>{
  assert.deepEqual(COOLPROP_HELP.map(topic=>topic.id),["overview","diagram","phase","units","basis","errors"]);
});

test("CoolProp help is locally searchable",()=>{
  assert.equal(searchCoolPropHelp("saturation")[0].id,"diagram");
  assert.ok(searchCoolPropHelp("PropsSI").length>=2);
  assert.equal(searchCoolPropHelp("no such phrase").length,0);
});
