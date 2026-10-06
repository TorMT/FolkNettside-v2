import test from "node:test";
import assert from "node:assert/strict";
import {
  crystalPreset,crystalType,distance3,idealHoleCenters,
  listCrystalTypes,replicateCrystal,scaledPoints
} from "../src/tools/crystal-structures-core.js";

test("all legacy crystal structure choices are represented",()=>{
  const ids=listCrystalTypes().map(item=>item.id);
  assert.deepEqual(ids,["sc","bcc","fcc","diamond","hcp","nacl","cscl","zns","caf2","spinel"]);
});

test("legacy conventional-cell site counts are preserved",()=>{
  assert.equal(crystalType("sc").sites.length,8);
  assert.equal(crystalType("bcc").sites.length,9);
  assert.equal(crystalType("fcc").sites.length,14);
  assert.equal(crystalType("diamond").sites.length,18);
  assert.equal(crystalType("nacl").sites.length,8);
  assert.equal(crystalType("cscl").sites.length,2);
  assert.equal(crystalType("zns").sites.length,8);
  assert.equal(crystalType("caf2").sites.length,12);
});

test("presets retain legacy material mappings",()=>{
  assert.equal(crystalPreset("Fe").structure,"bcc");
  assert.equal(crystalPreset("Cu").structure,"fcc");
  assert.equal(crystalPreset("Si").structure,"diamond");
  assert.equal(crystalPreset("MgAl2O4").structure,"spinel");
});

test("replication deduplicates shared cubic boundaries",()=>{
  const one=replicateCrystal("sc",{nx:1,ny:1,nz:1});
  const two=replicateCrystal("sc",{nx:2,ny:1,nz:1});
  assert.equal(one.length,8);
  assert.equal(two.length,12);
});

test("ionic structures retain species identity",()=>{
  const nacl=replicateCrystal("nacl");
  assert.equal(nacl.filter(site=>site.species==="A").length,4);
  assert.equal(nacl.filter(site=>site.species==="B").length,4);
});

test("hcp ideal c over a remains available",()=>{
  const points=scaledPoints("hcp",{a:2});
  const extent=Math.max(...points.map(p=>p[2]))-Math.min(...points.map(p=>p[2]));
  assert.ok(Math.abs(extent-2*Math.sqrt(8/3))<1e-6);
});

test("legacy hole sets are represented",()=>{
  assert.equal(idealHoleCenters("fcc").tetra.length,8);
  assert.equal(idealHoleCenters("fcc").octa.length,13);
  assert.equal(idealHoleCenters("bcc").tetra.length,12);
  assert.equal(idealHoleCenters("sc").octa.length,1);
});

test("distance helper supports measurement logic",()=>{
  assert.equal(distance3([0,0,0],[3,4,0]),5);
});
