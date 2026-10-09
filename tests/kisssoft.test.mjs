import test from "node:test";
import assert from "node:assert/strict";
import {parseKisssoft,decodeKisssoft,parseKisssoftBuffer} from "../src/engineering/kisssoft-core.js";
import {kisssoftDiagram,kisssoftSummary} from "../src/engineering/kisssoft-tool.js";

const sample="VERSION=26.0;\nKSOFTVERSION=2026 -SP1¶MODULE=Z014¶ZR[0].z=25¶ZR[1].z=35¶ZR[2].z=-95¶ZR[0].b=35¶ZR[1].b=35¶ZR[2].b=35¶ZS.Geo.mn=2¶ZS.Geo.beta=0¶";
test("KISSsoft Z014 parses planetary dimensions without hardcoding file name",()=>{
 const model=parseKisssoft(sample,"Stage3PlanetaryGear.Z14");
 assert.equal(model.moduleCode,"Z014");
 assert.deepEqual(model.gears.map(g=>g.teeth),[25,35,-95]);
 assert.equal(model.centerDistance,60);
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
