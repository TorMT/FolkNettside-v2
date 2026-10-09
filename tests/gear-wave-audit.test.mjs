import test from "node:test";
import assert from "node:assert/strict";
import {gearPitchGeometry,externalGearPair,checkPlanetaryPitch} from "../src/engineering/gear-pitch-checks.js";
import {parseKisssoft} from "../src/engineering/kisssoft-core.js";
import {normaliseWaveCase,waveElevation} from "../src/model/wave-core.js";
import {waveModelHeave} from "../src/model/wave-model-motion.js";

test("non-planetary two-shaft helix preview uses transverse module and tooth ratio",()=>{
 const model=parseKisssoft([
  "KSOFTVERSION=2026 -SP1","MODULE=Z012",
  "ZR[0].z=18","ZR[1].z=36","ZS.Geo.mn=2","ZS.Geo.beta=0.3490658503988659",
  "ZR[0].b=30","ZR[1].b=30"
 ].join("\n"),"two-shaft.Z12");
 assert.equal(model.planetary,false);
 const p=externalGearPair(model);
 assert.ok(p);
 const mt=2/Math.cos(20*Math.PI/180);
 assert.ok(Math.abs(p.centerDistance-27*mt)<1e-9);
 assert.equal(p.velocityRatio,-.5);
 assert.ok(Math.abs(p.tangencyResidual)<1e-9);
 assert.ok(Number.isFinite(p.a.helixLead));
 assert.ok(Math.abs(p.a.helixLead-p.b.helixLead/2)<1e-9);
});

test("helical planetary pitch closure works with transverse module and rejects invalid teeth",()=>{
 const model=parseKisssoft("MODULE=Z014\nZR[0].z=25\nZR[1].z=35\nZR[2].z=-95\nZS.Geo.mn=2\nZS.Geo.beta=0.4363323129985824\n","planet.Z14");
 const check=checkPlanetaryPitch(model);
 assert.ok(Math.abs(check.residual)<1e-9);
 assert.ok(Math.abs(check.sunPlanetCenterDistance-check.ringPlanetCenterDistance)<1e-9);
 assert.ok(check.sunPlanetCenterDistance>60);
 assert.throws(()=>gearPitchGeometry({module:2,beta:90,teeth:25}),/angle/);
 assert.equal(externalGearPair(model),null);
});

test("Anchored vessel stays motionless while follow-mode visual heave matches linear waves",()=>{
 const wave=normaliseWaveCase({heightM:2,periodS:6,headingDeg:0});
 assert.equal(waveModelHeave(wave,0,"anchored"),0);
 assert.equal(waveModelHeave(wave,3,"anchored"),0);
 assert.ok(Math.abs(waveModelHeave(wave,0,"follow")-1)<1e-10);
 assert.ok(Math.abs(waveModelHeave(wave,3,"follow")+1)<1e-10);
 assert.equal(waveModelHeave(null,7,"follow"),0);
 assert.ok(Math.abs(waveModelHeave(wave,1,"follow",0,0)-waveElevation(wave,0,0,1))<1e-12);
 assert.throws(()=>waveModelHeave(wave,1,"response-prediction"),/Unknown/);
});

test("KISSsoft internal ring/pinion uses positive ratio, ring helix hand and exact pitch gap",()=>{
 const model=parseKisssoft([
   "KSOFTVERSION=2026","MODULE=Z012",
   "ZR[0].z=20","ZR[1].z=-225",
   "ZR[0].b=30","ZR[1].b=40","ZS.Geo.mn=20","ZS.Geo.beta=0.2617993877991494"
 ].join("\\n"),"pitch-ring.Z12");
 const pair=externalGearPair(model);
 assert.ok(pair);
 assert.equal(pair.kind,"internal-pair");
 assert.equal(pair.internal,true);
 assert.ok(Math.abs(pair.velocityRatio-20/225)<1e-12);
 assert.ok(Math.abs(pair.centerDistance-(225-20)*10/Math.cos(15*Math.PI/180))<1e-9);
 assert.ok(Math.abs(pair.tangencyResidual)<1e-9);
 const invalid=parseKisssoft("MODULE=Z014\\nZR[0].z=25\\nZR[1].z=35\\nZR[2].z=-96\\nZS.Geo.mn=2","bad.Z14");
 assert.equal(externalGearPair(invalid),null,"Broken planetary must never silently become a two-shaft pair");
});
