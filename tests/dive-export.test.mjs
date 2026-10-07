import test from "node:test";
import assert from "node:assert/strict";
import {diveFeaturesCSV,diveFeaturesGeoJSON} from "../src/diverse/dive-export.js";

const feature={
  type:"Feature",
  id:"D001",
  geometry:{type:"Point",coordinates:[10.2,63.4]},
  properties:{
    ID:"D001",Navn:"Test, site",Område:"Trondheim",Kategori:"Natur",Status:"Practical",
    Dybde_min_m:5,Dybde_max_m:20,Kilde_nivå:"Nivå 1",Datakvalitet:"A – test",
    Adkomst:"Land",Bunn_terreng:"Rock",Strøm_fare_forbehold:"Verify current",
    Observert_dyreliv:"torsk",Mulig_rapportert_dyreliv:null,Vrak_historie:null,Vern_kulturminne:null,
    Kilde_IDer:"S01",source_urls:["https://example.com/a","https://example.com/b"],verified_date:"2026-10-04"
  }
};

test("Dive CSV preserves coordinates, sources and quoted text",()=>{
  const csv=diveFeaturesCSV([feature]);
  assert.match(csv,/id,name,area,category,status,lat,lon/);
  assert.match(csv,/"Test, site"/);
  assert.match(csv,/63\.4,10\.2/);
  assert.match(csv,/https:\/\/example\.com\/a \| https:\/\/example\.com\/b/);
});

test("Dive GeoJSON export records public filtering provenance",()=>{
  const text=diveFeaturesGeoJSON([feature],{source:"master.xlsx",filters:{quality:"A"}});
  const parsed=JSON.parse(text);
  assert.equal(parsed.type,"FeatureCollection");
  assert.equal(parsed.metadata.publicExport,true);
  assert.equal(parsed.metadata.records,1);
  assert.equal(parsed.metadata.source,"master.xlsx");
  assert.deepEqual(parsed.metadata.filters,{quality:"A"});
  assert.deepEqual(parsed.features[0].geometry.coordinates,[10.2,63.4]);
});
