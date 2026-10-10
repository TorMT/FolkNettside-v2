import test from "node:test";
import assert from "node:assert/strict";
import {brewingEndpoint,loadBrewingServiceConfig} from "../src/diverse/brewing/backend-config.js";
const baseURI="https://tormt.folk.ntnu.no/v2-staging/index.html#/diverse/brewing";
const config={brewing:{enabled:true,raptBase:"./includes/rapt/api/",brewingBase:"./includes/brewing/api/"}};

test("Brewing and RAPT endpoints remain within the V2 staged subdirectory",()=>{
  assert.equal(brewingEndpoint(config,"rapt","dashboard.php",{baseURI}),
    "https://tormt.folk.ntnu.no/v2-staging/includes/rapt/api/dashboard.php");
  assert.equal(brewingEndpoint(config,"brewing","logs.php",{baseURI}),
    "https://tormt.folk.ntnu.no/v2-staging/includes/brewing/api/logs.php");
  assert.equal(brewingEndpoint(config,"brewing","storage.php",{baseURI}),
    "https://tormt.folk.ntnu.no/v2-staging/includes/brewing/api/storage.php");
});

test("No backend configured means no root-relative V1 access even on NTNU",()=>{
  for(const cfg of [null,{}, {brewing:{enabled:false,...config.brewing}},
    {brewing:{enabled:true,raptBase:"/includes/rapt/api/",brewingBase:"/includes/brewing/api/"}},
    {brewing:{enabled:true,raptBase:"https://evil.test/",brewingBase:"./includes/brewing/api/"}},
    {brewing:{enabled:true,raptBase:"../includes/rapt/api/",brewingBase:"../../includes/brewing/api/"}}]){
    assert.equal(brewingEndpoint(cfg,"rapt","dashboard.php",{baseURI}),null);
  }
  for(const file of ["../admin.php","/dashboard.php","dashboard.php?refresh=1","script.js","../../index.html"]){
    assert.equal(brewingEndpoint(config,"rapt",file,{baseURI}),null);
  }
});

test("V2 service config is optional, disabled on missing file or broken JSON",async()=>{
  const seen=[];
  assert.equal(await loadBrewingServiceConfig(async url=>{seen.push(url);return {ok:false}}),null);
  assert.deepEqual(seen,["./data/service-endpoints.json"]);
  assert.equal(await loadBrewingServiceConfig(async()=>({ok:true,json:async()=>config})),config);
  assert.equal(await loadBrewingServiceConfig(async()=>{throw new Error("offline")}),null);
});
