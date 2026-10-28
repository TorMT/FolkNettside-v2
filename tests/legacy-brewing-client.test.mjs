import test from "node:test";
import assert from "node:assert/strict";
import {brewingEndpoint} from "../src/diverse/brewing/backend-config.js";
import {folkBrewingFetch,LEGACY_READ_BASE,isLegacyProxyUrl}
  from "../src/diverse/brewing/legacy-read-client.js";

const cfg={legacyReadProxy:{enabled:true,base:LEGACY_READ_BASE}};
const publishable="sb_publishable_1234567890_test";
const account={status:"signed-in",user:{id:"12345678-1234-4234-a234-123456789012"}};
const token="header.payload.signature";
const fakeAuth=()=>({url:"https://aeuouzkiyddfjtjfdosp.supabase.co",publishableKey:publishable});

test("opt-in proxy maps only four read endpoints, all writes denied",()=>{
  assert.equal(brewingEndpoint(cfg,"rapt","dashboard.php"),LEGACY_READ_BASE+"rapt/dashboard.php");
  for(const file of ["recipes.php","reference.php","logs.php"])
    assert.equal(brewingEndpoint(cfg,"brewing",file),LEGACY_READ_BASE+"brewing/"+file);
  for(const file of ["export.php","storage.php","admin.php","../../secrets.php"])
    assert.equal(brewingEndpoint(cfg,"brewing",file),null);
  assert.equal(brewingEndpoint({}, "rapt","dashboard.php"),null);
  assert.equal(brewingEndpoint({legacyReadProxy:{...cfg.legacyReadProxy,base:"https://evil.example/"}},
    "rapt","dashboard.php"),null);
});
test("browser sends Supabase bearer only to pinned proxy host and route",async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return new Response('{"ok":true}',{status:200})};
  const context={fetchImpl,configLoader:async()=>fakeAuth(),tokenProvider:async()=>token,
    snapshotProvider:()=>account};
  const url=LEGACY_READ_BASE+"rapt/dashboard.php?days=7";
  const result=await folkBrewingFetch(url,{cache:"force-cache"},context);
  assert.equal(result.status,200);
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.headers.get("Authorization"),"Bearer "+token);
  assert.equal(calls[0].options.headers.get("apikey"),publishable);
  assert.equal(calls[0].options.cache,"no-store");
  assert.equal(calls[0].options.redirect,"error");
  assert.equal(calls[0].options.credentials,"omit");
  const outside=await folkBrewingFetch("https://tormt.folk.ntnu.no/includes/rapt/api/dashboard.php",{},context);
  assert.equal(outside.status,200);
  assert.equal(calls[1].options.headers,undefined,"V1 directly never receives a Supabase bearer");
  for(const outside of [
    "https://evil.example/functions/v1/legacy-brewing/rapt/dashboard.php",
    "https://aeuouzkiyddfjtjfdosp.supabase.co@evil.example/functions/v1/legacy-brewing/",
    "https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/folk-core/session"])
    assert.equal(isLegacyProxyUrl(outside),false);
});
test("signed-out requests, writes and changed account fail without network",async()=>{
  const url=LEGACY_READ_BASE+"rapt/dashboard.php";
  let calls=0;
  const fetchImpl=async()=>{calls++;return new Response("{}",{status:200})};
  const context={fetchImpl,configLoader:async()=>fakeAuth(),tokenProvider:async()=>token,
    snapshotProvider:()=>({...account,status:"signed-out"})};
  await assert.rejects(folkBrewingFetch(url,{},context),/Sign in/);
  await assert.rejects(folkBrewingFetch(url,{method:"POST"},context),/read-only/);
  let switches=0;
  await assert.rejects(folkBrewingFetch(url,{},{
    ...context,
    snapshotProvider:()=>switches++===0?account:{...account,user:{id:"other-id"}}
  }),/account changed/);
  assert.equal(calls,0);
});
