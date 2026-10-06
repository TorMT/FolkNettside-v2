import test from "node:test";
import assert from "node:assert/strict";
import {TOOL_REGISTRY,activeTools,toolById,toolParityComplete,toolsNeedingParityReview,visibleTools} from "../src/tools/tool-registry.js";

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


test("unfinished legacy migrations always preserve full legacy access",()=>{
  for(const tool of toolsNeedingParityReview()){
    assert.ok(tool.legacyUrl?.startsWith("https://"),tool.id+" lost its legacy fallback before full parity");
  }
});

test("CoolProp stays in review until side-by-side verification is complete",()=>{
  const tool=toolById("coolprop");
  assert.equal(toolParityComplete(tool),false);
  assert.equal(tool.parity,"review");
  assert.ok(tool.legacyUrl);
});


test("known legacy-only tools stay registered until migrated",()=>{
  for(const id of ["chemdraw","stl-advanced"]){
    const tool=toolById(id);
    assert.ok(tool,id+" disappeared from tool registry");
    assert.equal(tool.status,"legacy");
    assert.equal(tool.parity,"partial");
    assert.ok(tool.legacyUrl);
  }
});

test("crystal migration is partial while advanced legacy features are missing",()=>{
  const tool=toolById("crystal");
  assert.equal(tool.parity,"partial");
  assert.ok(tool.legacyUrl?.includes("KrystallStrukturer"));
});


test("retired theme tools are intentionally excluded from v2 parity work",()=>{
  const theme=toolById("theme-creator");
  const imageTheme=toolById("image-theme");
  assert.equal(theme.status,"retired");
  assert.equal(theme.parity,"retired");
  assert.equal(imageTheme.status,"retired");
  assert.equal(imageTheme.parity,"retired");
  assert.ok(!visibleTools().some(tool=>tool.id==="theme-creator"||tool.id==="image-theme"));
  assert.ok(!toolsNeedingParityReview().some(tool=>tool.id==="theme-creator"||tool.id==="image-theme"));
});
