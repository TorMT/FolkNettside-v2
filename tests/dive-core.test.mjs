import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {diveFeatureKind,diveFeatureLevel,diveFeatureMaxDepth,diveFeatureQuality,diveStats,filterDiveFeatures,sortDiveFeatures} from "../src/diverse/dive-core.js";

const dataset=JSON.parse(await readFile(new URL("../data/diving/trondheim-sites.geojson",import.meta.url),"utf8"));
const features=dataset.features;

test("dive dataset snapshot preserves the DG-enriched canonical master",()=>{
  assert.ok(features.length>=88);
  const located=features.filter(feature=>feature.geometry?.type==="Point");
  const unlocated=features.filter(feature=>feature.geometry===null);
  assert.ok(located.length>=60);
  assert.ok(unlocated.length>0);
  for(const feature of features){
    if(feature.geometry){
      const [lon,lat]=feature.geometry.coordinates;
      assert.ok(Number.isFinite(lon)&&Number.isFinite(lat));
      assert.notDeepEqual([lon,lat],[0,0]);
    }
    assert.ok(feature.properties?.Navn);
    assert.ok(Array.isArray(feature.properties?.source_urls));
  }
});

test("dive level and wreck classification follow source metadata",()=>{
  const korsvika=features.find(f=>f.properties.Navn==="Korsvika");
  const vangshylla=features.find(f=>f.properties.Navn==="Vangshylla");
  const hercules=features.find(f=>f.properties.Navn==="Herkules");
  const hundhammeren=features.find(f=>f.properties.Navn==="Hundhammeren");
  const tautrarevet=features.find(f=>f.properties.Navn==="Tautrarevet");
  assert.equal(diveFeatureLevel(korsvika),"P1");
  assert.equal(diveFeatureLevel(vangshylla),"P3");
  assert.equal(diveFeatureLevel(hercules),"TECH");
  assert.equal(diveFeatureLevel(hundhammeren),"P3");
  assert.equal(diveFeatureLevel(tautrarevet),"TECH");
  assert.equal(diveFeatureKind(hercules),"wreck");
});

test("dive filters combine text, type, level and depth",()=>{
  const wrecks=filterDiveFeatures(features,{kind:"wreck",maxDepth:"20"});
  assert.ok(wrecks.length>0);
  assert.ok(wrecks.every(f=>diveFeatureKind(f)==="wreck"));
  assert.ok(wrecks.every(f=>diveFeatureMaxDepth(f)===null||diveFeatureMaxDepth(f)<=20));

  const wildlife=filterDiveFeatures(features,{query:"hummer"});
  assert.ok(wildlife.some(f=>f.properties.Navn==="Flakk"));
  assert.ok(wildlife.some(f=>f.properties.Navn==="Skålvika"));

  const p1=filterDiveFeatures(features,{level:"P1"});
  assert.ok(p1.length>0);
  assert.ok(p1.every(f=>diveFeatureLevel(f)==="P1"));
});

test("dive sorting and stats are deterministic",()=>{
  const byDepth=sortDiveFeatures(features,"depth");
  const known=byDepth.map(diveFeatureMaxDepth).filter(v=>v!==null);
  assert.deepEqual(known,[...known].sort((a,b)=>a-b));
  const stats=diveStats(features);
  assert.equal(stats.total,features.length);
  assert.ok(stats.withCoordinates<features.length);
  assert.ok(stats.withCoordinates>=60);
  assert.equal(stats.wrecks+stats.nature,features.length);
});


test("DG additions and data-quality filtering are preserved",()=>{
  assert.ok(features.some(f=>f.properties.Navn==="Ladekaia"));
  assert.ok(features.some(f=>f.properties.Navn==="Hundhammeren"));
  assert.ok(features.some(f=>f.properties.Navn==="Tautrarevet"));
  const strongest=filterDiveFeatures(features,{quality:"A"});
  assert.ok(strongest.length>0);
  assert.ok(strongest.every(f=>diveFeatureQuality(f)==="A"));
  const verify=filterDiveFeatures(features,{quality:"C"});
  assert.ok(verify.some(f=>String(f.properties.Datakvalitet).startsWith("C")));
});
