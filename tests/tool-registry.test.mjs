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
    assert.ok(tool.route.startsWith("/"));
    assert.ok(tool.category);
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

test("CoolProp is full after deployed and real-WASM numerical verification",()=>{
  const tool=toolById("coolprop");
  assert.equal(toolParityComplete(tool),true);
  assert.equal(tool.parity,"full");
  assert.ok(tool.legacyUrl);
});



test("Theme Studio manual and image modes share one verified Settings architecture",()=>{
  const manual=toolById("theme-creator");
  const image=toolById("image-theme");
  assert.equal(manual.status,"prototype");
  assert.equal(manual.parity,"full");
  assert.equal(image.status,"prototype");
  assert.equal(image.parity,"full");
  for(const tool of [manual,image]){
    assert.ok(tool.route?.startsWith("/settings/theme-studio/"));
    assert.ok(tool.legacyUrl?.startsWith("https://"));
    assert.ok(visibleTools().some(item=>item.id===tool.id));
  }
  assert.equal(toolsNeedingParityReview().some(item=>item.id==="theme-creator"),false);
  assert.equal(toolsNeedingParityReview().some(item=>item.id==="image-theme"),false);
  assert.notEqual(manual.route,image.route);
});


test("browser-verified parity tools are marked full",()=>{
  for(const id of ["fluid","periodic","crystal","chemdraw","stl-advanced","theme-creator","image-theme","coolprop"]){
    const tool=toolById(id);
    assert.ok(tool,id+" missing");
    assert.equal(tool.parity,"full",id+" should be full after deployed browser verification");
    assert.equal(toolParityComplete(tool),true);
    assert.ok(tool.legacyUrl?.startsWith("https://"),id+" should keep legacy safety link for now");
  }
});

test("Image-to-Theme is full after deployed browser verification",()=>{
  const tool=toolById("image-theme");
  assert.equal(tool.parity,"full");
  assert.equal(toolParityComplete(tool),true);
  assert.ok(tool.legacyUrl?.startsWith("https://"));
});
