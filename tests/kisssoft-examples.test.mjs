import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseKisssoft} from "../src/engineering/kisssoft-core.js";
import {checkPlanetaryPitch,externalGearPair} from "../src/engineering/gear-pitch-checks.js";
import {kisssoftDiagram,kisssoftPageHTML} from "../src/engineering/kisssoft-tool.js";
import {planetaryRates} from "../src/engineering/kisssoft-motion.js";

async function fixture(name){
  const text=await readFile(new URL("../examples/kisssoft/"+name,import.meta.url),"utf8");
  return parseKisssoft(text,name);
}

test("bundled planetary example restores original fixed-ring motion geometry",async()=>{
  const model=await fixture("PlanetaryExample.Z14");
  assert.deepEqual(model.gears.map(g=>g.teeth),[25,35,-95]);
  assert.equal(model.planetary,true);
  assert.equal(model.consistent,true);
  assert.ok(Math.abs(checkPlanetaryPitch(model).residual)<1e-10);
  assert.ok(Math.abs(model.centerDistance-model.sourceCenterDistance)<1e-9);
  const rates=planetaryRates(25,35,95,{mode:"ring-fixed"});
  assert.equal(rates.ring,0);
  assert.ok(Math.abs(rates.carrier-25/120)<1e-10);
  assert.match(kisssoftDiagram(model),/<svg/);
});
test("both internal ring examples have consistent native geometry and Z012RS support",async()=>{
  for(const name of ["InternalRingAndPinion.Z12","InternalRingAndPinion.Z012RS"]){
    const model=await fixture(name);
    const pair=externalGearPair(model);
    assert.equal(model.moduleCode,"Z012");
    assert.equal(pair.internal,true);
    assert.deepEqual(model.gears.slice(0,2).map(g=>g.teeth),[20,-225]);
    assert.ok(Math.abs(model.beta-15)<1e-8);
    assert.ok(Math.abs(pair.velocityRatio-20/225)<1e-12);
    assert.ok(Math.abs(pair.centerDistance-model.sourceCenterDistance)<.0001,
      name+" source center distance does not match unshifted helical nominal pitch");
    assert.match(kisssoftDiagram(model),/Conceptual internal ring/);
  }
});
test("external helical example has correct center distance, sign and native beta",async()=>{
  const model=await fixture("HelicalExternalPair.Z12");
  const pair=externalGearPair(model);
  assert.equal(pair.internal,false);
  assert.equal(pair.velocityRatio,-.5);
  assert.ok(Math.abs(model.beta-20)<1e-8);
  assert.ok(Math.abs(pair.centerDistance-model.sourceCenterDistance)<.0001);
  assert.match(kisssoftDiagram(model),/<svg/);
});
test("all three example actions and download links remain discoverable",()=>{
  const html=kisssoftPageHTML();
  for(const id of ["data-kisssoft-example","data-kisssoft-ring-example","data-kisssoft-external-example"])
    assert.ok(html.includes(id),id+" removed");
  for(const name of ["PlanetaryExample.Z14","InternalRingAndPinion.Z012RS","HelicalExternalPair.Z12"])
    assert.ok(html.includes("./examples/kisssoft/"+name),name+" download missing");
});
