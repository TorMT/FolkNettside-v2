import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {DIVE_CATALOG_FILES,diveCountry,mergeDiveCatalog,loadDiveCatalog} from "../src/diverse/dive-catalog.js";
import {diveBathymetryUrl,assessDiveBathymetry} from "../src/diverse/dive-bathymetry.js";
import {diveFeatureCountry,filterDiveFeatures,sortDiveFeatures,diveFeatureSource,diveOriginalId} from "../src/diverse/dive-core.js";

const root=new URL("../",import.meta.url);
async function readDataset(path){
  return JSON.parse(await readFile(new URL(path,root),"utf8"));
}

test("world catalog contains thousands of traceable sites; original Trondheim features remain",async()=>{
  const collections=await Promise.all([
    readDataset("data/diving/trondheim-sites.geojson"),
    ...DIVE_CATALOG_FILES.map(readDataset)
  ]);
  const sites=mergeDiveCatalog(collections);
  assert.ok(sites.length>6000, `got ${sites.length}`);
  const dkRecords=sites.filter(f=>String(f.properties.Kilde_IDer||"").includes("Dykkekart.no"));
  assert.ok(dkRecords.length>=250, `Only ${dkRecords.length} merged Dykkekart records`);
  assert.ok(sites.some(f=>f.properties.ID==="D001"));
  assert.ok(sites.some(f=>f.properties.ID==="W007"));
  assert.ok(sites.some(f=>f.properties.Kilde_IDer.includes("OpenDiveMap")));
  assert.ok(sites.some(f=>f.properties.Global_rangering===1));
  assert.equal(new Set(sites.map(f=>f.properties.ID)).size,sites.length);
});
test("country normalization and precise source filtering work",()=>{
  const items=[
    {properties:{ID:"D001",Land:"Norge",Område:"Trondheim",Navn:"Original",Kilde_IDer:"S03"}},
    {properties:{ID:"OD00001",Land:"Norway",Område:"Trondheim",Navn:"Open site",Kilde_IDer:"OpenDiveMap"}},
    {properties:{ID:"GL00001",Land:"Egypt",Område:"Red Sea",Navn:"Ocean",Kilde_IDer:"UnderwaterAtlas-Top500",Global_rangering:1}},
    {properties:{ID:"DK0001",Land:"Norge",Område:"Vestland",Navn:"Published GPS",Kilde_IDer:"Dykkekart.no"}}
  ];
  assert.equal(diveCountry(items[1]),"Norge");
  assert.equal(diveFeatureCountry(items[1]),"Norge");
  assert.equal(filterDiveFeatures(items,{country:"Norge"}).length,3);
  assert.equal(filterDiveFeatures(items,{region:"Trondheim"}).length,2);
  assert.equal(filterDiveFeatures(items,{source:"opendivemap"}).length,1);
  assert.equal(filterDiveFeatures(items,{source:"original"}).length,1);
  assert.equal(filterDiveFeatures(items,{source:"local"}).length,1);
  assert.equal(diveFeatureSource(items[3]),"local");
  assert.equal(diveOriginalId("D001"),true);
  assert.equal(diveOriginalId("A001"),true);
  assert.equal(diveOriginalId("DK0001"),false);
  assert.equal(sortDiveFeatures(items,"global")[0].properties.ID,"GL00001");
  assert.equal(filterDiveFeatures(items,{maxDepth:"20"}).length,0,
    "A depth filter must not silently include unknown-depth sites");
});
test("same-name distant dive sites are not merged",()=>{
  const two=[
    {features:[{type:"Feature",geometry:{type:"Point",coordinates:[10.2,63.4]},properties:{ID:"D001",Land:"Norge",Område:"Trøndelag",Navn:"Same name",source_urls:["https://example.com/a"]}}]},
    {features:[{type:"Feature",geometry:{type:"Point",coordinates:[6,60]},properties:{ID:"NO0001",Land:"Norge",Område:"Vestlandet",Navn:"Same name",source_urls:["https://example.com/b"]}}]}
  ];
  assert.equal(mergeDiveCatalog(two).length,2);
});
test("bathymetry only represents a seabed model cell, never maximum dive depth",()=>{
  const example={type:"Feature",geometry:{type:"Point",coordinates:[4.731333,61.039333]},properties:{Lat:61.039333,Lon:4.731333}};
  assert.ok(diveBathymetryUrl(example).includes("POINT(4.731333%2061.039333)"));
  assert.deepEqual(assessDiveBathymetry({avg:6.54}),{status:"land-or-dry",depth:null});
  assert.equal(assessDiveBathymetry({avg:-32.809,min:-33,max:-32}).depth,32.8);
  assert.equal(assessDiveBathymetry({avg:null}).status,"unavailable");
});
test("a missing supplemental chunk cannot hide original data",async()=>{
  const origin={type:"FeatureCollection",metadata:{source:"original"},features:[{type:"Feature",geometry:null,properties:{ID:"D999",Land:"Norge",Navn:"Original"}}]};
  const fetchImpl=async url=>url.endsWith("trondheim-sites.geojson")
    ?{ok:true,json:async()=>origin}:{ok:false,status:404};
  const data=await loadDiveCatalog("./data/diving/trondheim-sites.geojson",fetchImpl);
  assert.equal(data.features.length,1);
  assert.equal(data.failed.length,DIVE_CATALOG_FILES.length);
});
