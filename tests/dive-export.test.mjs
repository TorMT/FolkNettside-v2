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


test("CSV and GeoJSON retain unverified records but do not present disclaimed coordinates as usable",()=>{
  const withheld={
    ...feature,id:"D013",geometry:{type:"Point",coordinates:[9.868017,63.483067]},
    properties:{...feature.properties,ID:"D013",Navn:"Tråsåvika Camping",
      Lat:63.483067,Lon:9.868017,
      Notater:"Ikke bruk koordinatet uten lokal verifisering.",
      source_urls:["https://example.org/source","javascript:alert(1)"]}
  };
  const invalid={
    ...feature,id:"Xbad",geometry:{type:"Point",coordinates:[10.2,95]},
    properties:{...feature.properties,ID:"Xbad",Navn:"Malformed coordinate",Lat:95,Lon:10.2}
  };
  const src=JSON.stringify(withheld);
  const csv=diveFeaturesCSV([withheld,invalid]);
  assert.match(csv,/D013,Tråsåvika Camping,Trondheim,Natur,Practical,,,/);
  assert.match(csv,/Xbad,Malformed coordinate,Trondheim,Natur,Practical,,,/);
  assert.doesNotMatch(csv,/63\.483067|9\.868017|javascript:/);
  const text=diveFeaturesGeoJSON([withheld,invalid],{
    origin:{lat:63.4,lon:10.3},
    source:"approved source",
    filters:{quality:"C",origin:{lat:63.4,lon:10.3}},
    publicExport:false,records:9999
  });
  const output=JSON.parse(text);
  assert.equal(output.metadata.publicExport,true);
  assert.equal(output.metadata.records,2);
  assert.equal(output.metadata.source,"approved source");
  assert.deepEqual(output.metadata.filters,{quality:"C"});
  assert.equal(output.features[0].geometry,null);
  assert.equal(output.features[0].properties.Lat,null);
  assert.equal(output.features[0].properties.Lon,null);
  assert.equal(output.features[0].properties.location_status,"unverified");
  assert.deepEqual(output.features[0].properties.source_urls,["https://example.org/source"]);
  assert.equal(output.features[1].geometry,null);
  assert.equal(output.features[1].properties.location_status,"invalid");
  assert.equal(JSON.stringify(withheld),src,"export mutated canonical source record");
});

test("spreadsheet formula injection is neutralized in CSV free-text cells",()=>{
  const payload={...feature,properties:{
    ...feature.properties,Navn:"=HYPERLINK(\"https://attacker.invalid\",\"click\")",
    Notater:"+SUM(1,2)",Adkomst:" @SUM(1,2)",Dybde_max_m:20
  }};
  const csv=diveFeaturesCSV([payload]);
  assert.match(csv,/id,name,area,category,status/);
  assert.match(csv,/'=HYPERLINK/);
  assert.match(csv,/' @SUM/);
  assert.match(csv,/,5,20,/);
});
