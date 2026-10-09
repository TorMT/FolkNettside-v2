import test from "node:test";
import assert from "node:assert/strict";
import {parseKisssoft,decodeKisssoft,parseKisssoftBuffer} from "../src/engineering/kisssoft-core.js";
import {kisssoftDiagram,kisssoftSummary,filterKisssoftFields} from "../src/engineering/kisssoft-tool.js";

const sample="VERSION=26.0;\nKSOFTVERSION=2026 -SP1¶MODULE=Z014¶ZR[0].z=25¶ZR[1].z=35¶ZR[2].z=-95¶ZR[0].b=35¶ZR[1].b=35¶ZR[2].b=35¶ZS.Geo.mn=2¶ZS.Geo.beta=0¶ZP[0].a=60¶";
test("KISSsoft Z014 parses planetary dimensions without hardcoding file name",()=>{
 const model=parseKisssoft(sample,"Stage3PlanetaryGear.Z14");
 assert.equal(model.moduleCode,"Z014");
 assert.deepEqual(model.gears.map(g=>g.teeth),[25,35,-95]);
 assert.equal(model.centerDistance,60);
 assert.equal(model.sourceCenterDistance,60);
 assert.match(kisssoftSummary(model),/ZP\[0\]\.a/);
 assert.equal(model.consistent,true);
 assert.match(kisssoftDiagram(model),/<svg/);
 assert.match(kisssoftSummary(model),/Concept sketch/);
});
test("UTF-16LE BOM import and guarded non-planetary files",()=>{
 const utf16=new Uint8Array([255,254,...Array.from(sample).flatMap(c=>[c.charCodeAt(0)&255,c.charCodeAt(0)>>8])]);
 const model=parseKisssoftBuffer(utf16.buffer,"gear.Z14");
 assert.equal(model.gears[2].teeth,-95);
 assert.equal(decodeKisssoft(utf16.buffer).includes("MODULE=Z014"),true);
 const other=parseKisssoft("MODULE=Z012¶VERSION=26.0¶","pair.z12");
 assert.equal(other.planetary,false);
 assert.doesNotMatch(kisssoftDiagram(other),/<svg/);
});
test("KISSsoft parser does not execute embedded text or render unescaped HTML",()=>{
 const model=parseKisssoft(sample+"calculation.description=<script>alert(1)</script>¶","Stage3PlanetaryGear.Z14");
 assert.equal(model.fields["calculation.description"],"<script>alert(1)</script>");
 assert.doesNotMatch(kisssoftSummary(model),/<script>/);
 assert.throws(()=>parseKisssoft("MODULE=Z014", "file.exe"),/Unsupported/);
 assert.throws(()=>parseKisssoft("arbitrary","test.z14"),/recognized/);
});

test("large parameter lists render in bounded, searchable batches",()=>{
 const fields=Object.fromEntries(Array.from({length:6300},(_,i)=>["ZR["+i+"].z",String(i)]));
 const all=filterKisssoftFields(fields);
 assert.equal(all.total,6300);
 assert.equal(all.shown.length,150);
 const selected=filterKisssoftFields(fields,"ZR[123].z");
 assert.equal(selected.total,1);
 assert.equal(selected.shown[0][1],"123");
 const html=kisssoftSummary({...parseKisssoft(sample,"gear.z14"),fields});
 assert.match(html,/Search recognized parameters/);
 assert.ok(html.length<60_000,"do not render all 6300 rows");
});

test("KISSsoft stores native helix and normal pressure angles in radians, normalizes for geometry",()=>{
 const radians=Math.PI/9;
 const model=parseKisssoft(
  "MODULE=Z012\nZR[0].z=20\nZR[1].z=40\nZS.Geo.mn=3\nZS.Geo.beta="+radians+"\nZS.Geo.alfn="+radians,
  "gears.Z12");
 assert.equal(model.betaRad,radians);
 assert.ok(Math.abs(model.beta-20)<1e-10);
 assert.ok(Math.abs(model.pressureAngleNormalDeg-20)<1e-10);
 assert.ok(Math.abs(model.fields["ZS.Geo.beta"]-radians)<1e-12);
 assert.match(kisssoftSummary(model),/20\.000°/);
});


test("actual KISSsoft Z012RS and copied Z012RS(1) filenames parse as internal ring pair",()=>{
 const source="VERSION=26.0\\nMODULE=Z012\\nZR[0].z=20\\nZR[1].z=-225\\nZS.Geo.mn=20\\nZS.Geo.beta=0.2617993877991494";
 for(const name of ["PitchInternal.Z012RS","PitchInternal.Z012RS(1)"]){
   const model=parseKisssoft(source,name);
   assert.equal(model.moduleCode,"Z012");
   assert.equal(model.gears[1].teeth,-225);
   assert.equal(model.planetary,false);
   assert.ok(Math.abs(model.beta-15)<1e-8);
 }
});
test("Z014RS files retain planetary module detection",()=>{
 const model=parseKisssoft(
   "MODULE=Z014\\nZR[0].z=25\\nZR[1].z=35\\nZR[2].z=-95\\nZS.Geo.mn=2",
   "Sample.Z014RS");
 assert.equal(model.planetary,true);
 assert.equal(model.consistent,true);
});
