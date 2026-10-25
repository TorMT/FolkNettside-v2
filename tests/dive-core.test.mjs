import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {diveCoordinateAssessment,diveDistanceKm,diveFeatureKind,diveFeatureLevel,diveFeatureMaxDepth,diveFeaturePoint,diveFeatureQuality,diveFeatureWildlife,diveSourceUrls,diveStats,diveWildlifeIndex,filterDiveFeatures,sortDiveFeatures} from "../src/diverse/dive-core.js";

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


test("wildlife index supports include and exclude exploration",()=>{
  const index=diveWildlifeIndex(features);
  assert.ok(index.length>5);
  assert.ok(index.some(item=>/hummer/i.test(item.label)));
  const withHummer=filterDiveFeatures(features,{wildlife:"hummer"});
  assert.ok(withHummer.length>0);
  assert.ok(withHummer.every(feature=>diveFeatureWildlife(feature).some(item=>/hummer/i.test(item))));
  const withoutHummer=filterDiveFeatures(features,{wildlife:"hummer",excludeWildlife:true});
  assert.equal(withHummer.length+withoutHummer.length,features.length);
});

test("nearest sorting uses haversine distance only when an origin is available",()=>{
  const origin={lat:63.43,lon:10.39};
  const sorted=sortDiveFeatures(features,"nearest",{origin});
  const mapped=sorted.filter(feature=>feature.geometry?.type==="Point");
  const distance=feature=>{
    const [lon,lat]=feature.geometry.coordinates;
    return diveDistanceKm(origin,{lat,lon});
  };
  assert.ok(distance(mapped[0])<=distance(mapped[Math.min(5,mapped.length-1)]));
  assert.ok(diveDistanceKm(origin,origin)<1e-9);
});

test("missing or invalid geocoordinates never produce phantom zero-coordinate distances",()=>{
  const origin={lat:63.43,lon:10.39};
  assert.equal(diveDistanceKm(origin,{lat:null,lon:10}),null);
  assert.equal(diveDistanceKm(origin,{lat:63,lon:""}),null);
  assert.equal(diveDistanceKm(origin,{lat:91,lon:10}),null);
  assert.equal(diveDistanceKm(origin,{lat:63,lon:181}),null);
  const unknown={properties:{Navn:"Ukjent"},geometry:{type:"Point",coordinates:[null,null]}};
  const near={properties:{Navn:"Kjent"},geometry:{type:"Point",coordinates:[10.39,63.43]}};
  assert.equal(sortDiveFeatures([unknown,near],"nearest",{origin})[0],near);
});

test("map coordinate validation refuses missing, null or out-of-range locations",()=>{
  assert.equal(diveFeaturePoint({geometry:{type:"Point",coordinates:[null,null]}}),null);
  assert.equal(diveFeaturePoint({geometry:{type:"Point",coordinates:[10,95]}}),null);
  assert.equal(diveFeaturePoint({geometry:{type:"LineString",coordinates:[10,60]}}),null);
  assert.deepEqual(diveFeaturePoint({geometry:{type:"Point",coordinates:[10.39,63.43]}}),
    {lat:63.43,lon:10.39});
});


test("public map distinguishes 67 raw points from 64 usable pins without altering canonical source",()=>{
  const raw=features.filter(feature=>feature.geometry?.type==="Point");
  const visible=features.filter(feature=>diveFeaturePoint(feature)!==null);
  const withheld=features.filter(feature=>diveCoordinateAssessment(feature).status==="unverified");
  assert.equal(features.length,88);
  assert.equal(raw.length,67);
  assert.equal(visible.length,64);
  assert.deepEqual(withheld.map(feature=>feature.id).sort(),["D005","D013","X010"]);
  assert.equal(diveStats(features).unverifiedCoordinates,3);
  assert.equal(diveStats(features).withCoordinates,64);
  for(const feature of withheld){
    assert.equal(diveFeaturePoint(feature),null,feature.id);
    assert.ok(feature.geometry?.coordinates?.length===2,
      "Source snapshot must retain evidence coordinates until independently reviewed");
    assert.ok(feature.properties?.Notater,"Every withheld coordinate needs an explicit note");
  }
  const safelyMapped=features.find(feature=>feature.id==="D004");
  assert.deepEqual(diveFeaturePoint(safelyMapped),{lat:63.483067,lon:9.868017});
});

test("malformed or discrepant coordinates never become map pins or nearest targets",()=>{
  const make=(coordinates,properties={})=>({
    geometry:{type:"Point",coordinates},properties
  });
  assert.equal(diveCoordinateAssessment({geometry:null}).status,"missing");
  for(const coords of [[10,91],[181,63],[null,63],["10",63],[0,0],[10,63,99]]){
    assert.equal(diveCoordinateAssessment(make(coords)).status,"invalid",JSON.stringify(coords));
  }
  assert.equal(diveCoordinateAssessment(make([10.2,63.4],{Lat:63.5,Lon:10.2})).status,"invalid");
  assert.deepEqual(diveFeaturePoint(make([10.2,63.4],{Lat:63.4,Lon:10.2})),
    {lat:63.4,lon:10.2});
  const unverified=make([10.2,63.4],{Notater:"Ikke bruk koordinatet uten lokal verifisering."});
  assert.equal(diveCoordinateAssessment(unverified).status,"unverified");
  const nearest=sortDiveFeatures([unverified,make([10.3,63.5])],"nearest",{
    origin:{lat:63.4,lon:10.2}
  });
  assert.equal(nearest[0].geometry.coordinates[0],10.3);
});

test("external source urls accept only absolute http(s) without credentials",()=>{
  const urls=diveSourceUrls({source_urls:[
    "https://dykkepedia.com/wiki/Test",
    "http://example.org/source#note",
    "javascript:alert(1)",
    "data:text/html,%3Cscript%3E",
    "//example.com/relative",
    "https://username:password@example.com/sensitive",
    "file:///etc/passwd",
    "  https://safe.example/resource  "
  ]});
  assert.deepEqual(urls,[
    "https://dykkepedia.com/wiki/Test",
    "http://example.org/source#note",
    "  https://safe.example/resource  "
  ]);
});
