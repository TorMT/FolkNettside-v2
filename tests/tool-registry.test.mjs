import test from "node:test";
import assert from "node:assert/strict";
import {TOOL_REGISTRY,activeTools,toolById,toolParityComplete,toolsNeedingParityReview} from "../src/tools/tool-registry.js";

test("tool ids and active routes are unique",()=>{
  const ids=TOOL_REGISTRY.map(tool=>tool.id);
  assert.equal(new Set(ids).size,ids.length);
  const routes=activeTools().map(tool=>tool.route);
  assert.equal(new Set(routes).size,routes.length);
});

test("active tools expose searchable metadata",()=>{
  for(const tool of activeTools()){
    assert.ok(tool.title);
    assert.ok(tool.summary);
    assert.ok(Array.isArray(tool.keywords));
    assert.ok(tool.route.startsWith("/tools/"));
  }
});

test("registry lookup is deterministic",()=>{
  assert.equal(toolById("fluid")?.route,"/tools/fluid");
  assert.equal(toolById("missing"),null);
});


test("unfinished migrations preserve legacy access when a legacy tool exists",()=>{
  for(const tool of toolsNeedingParityReview()){
    if(["fluid","periodic","coolprop"].includes(tool.id)){
      assert.ok(tool.legacyUrl?.startsWith("https://"),`${tool.id} lost its legacy fallback`);
    }
  }
});

test("CoolProp cannot be marked full until feature parity is complete",()=>{
  const tool=toolById("coolprop");
  assert.equal(toolParityComplete(tool),false);
  assert.equal(tool.parity,"partial");
});
