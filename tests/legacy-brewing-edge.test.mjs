import test from "node:test";
import assert from "node:assert/strict";
import {
  handleLegacyBrewingRequest, buildUpstreamUrl, redactLegacyPayload
} from "../supabase/functions/legacy-brewing/core.js";

const base="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/legacy-brewing/";
const owner={id:"12345678-1234-4234-a234-123456789012",admin:true};
const jwt="Bearer header.payload.signature";
const req=(path,opts={})=>new Request(base+path,{
  method:opts.method||"GET",
  headers:{"Origin":opts.origin??"https://tormt.github.io",
    ...(opts.auth===false?{}:{"Authorization":jwt})}
});
const legacyResponse=(data,opts={})=>new Response(JSON.stringify(data),{
  status:opts.status||200,
  headers:{"Content-Type":opts.type||"application/json"}
});
test("owner-only GET allows four fixed V1 API routes",async()=>{
  const expected={
    "rapt/dashboard.php?days=max":"https://tormt.folk.ntnu.no/includes/rapt/api/dashboard.php?days=60",
    "brewing/recipes.php?ingredients=barley":"https://tormt.folk.ntnu.no/includes/brewing/api/recipes.php?ingredients=barley",
    "brewing/reference.php?q=hops":"https://tormt.folk.ntnu.no/includes/brewing/api/reference.php?q=hops",
    "brewing/logs.php?slug=batch-1":"https://tormt.folk.ntnu.no/includes/brewing/api/logs.php?slug=batch-1"
  };
  for(const [path,url] of Object.entries(expected)){
    assert.equal(buildUpstreamUrl(base+path).url,url);
  }
  const unapproved=[
    "brewing/storage.php","brewing/export.php","rapt/hydrometers.php",
    "rapt/dashboard.php?username=someone","rapt/dashboard.php?days=100",
    "brewing/recipes.php?ingredients=abc&ingredients=def",
    "brewing/logs.php?slug=../secret","brewing/%2e%2e/storage.php"
  ];
  for(const path of unapproved){
    assert.throws(()=>buildUpstreamUrl(base+path),{name:"Error"});
  }
});
test("rejects unauthenticated, non-admin, unknown origin, or POST before network",async()=>{
  let upstream=0;
  const fetchUpstream=async()=>{upstream++;return legacyResponse({devices:[]})};
  for(const request of [
    req("rapt/dashboard.php",{auth:false}),
    req("rapt/dashboard.php",{method:"POST"}),
    req("rapt/dashboard.php",{origin:"https://evil.example"}),
    req("brewing/storage.php")
  ]){
    const r=await handleLegacyBrewingRequest(request,{verifyOwner:async()=>owner,fetchUpstream});
    assert.ok([401,403,404,405].includes(r.status));
  }
  const denied=await handleLegacyBrewingRequest(req("rapt/dashboard.php"),{
    verifyOwner:async()=>({...owner,admin:false}),fetchUpstream});
  assert.equal(denied.status,403);
  assert.equal(upstream,0);
});
test("preflight only allows reviewed origins, does not reveal data",async()=>{
  const r=await handleLegacyBrewingRequest(req("rapt/dashboard.php",{
    method:"OPTIONS",auth:false}),{verifyOwner:async()=>{throw Error("should not run")}});
  assert.equal(r.status,204);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"),"https://tormt.github.io");
});
test("owner gets redacted JSON; never sends bearer or cookies upstream",async()=>{
  let requestUrl,init,seenToken;
  const r=await handleLegacyBrewingRequest(req("rapt/dashboard.php?days=7"),{
    verifyOwner:async token=>{seenToken=token;return owner},
    fetchUpstream:async(url,options)=>{
      requestUrl=url;init=options;
      return legacyResponse({username:"private-name",days:7,
        generatedAt:"2026-10-26T12:00:00Z",devices:[{
          name:"RAPT",macAddress:"AA:BB",apiKey:"should-not-leak",
          history:[{gravity:1020,access_token:"token-secret"}]}],
        clientSecret:"never expose"
      });
    }
  });
  assert.equal(r.status,200);
  assert.equal(seenToken,"header.payload.signature");
  assert.equal(requestUrl,"https://tormt.folk.ntnu.no/includes/rapt/api/dashboard.php?days=7");
  assert.equal(init.headers.Authorization,undefined);
  assert.equal(init.headers.Cookie,undefined);
  assert.equal(init.redirect,"error");
  const data=await r.json();
  assert.equal(data.devices[0].name,"RAPT");
  assert.equal(data.username,undefined);
  assert.equal(data.clientSecret,undefined);
  assert.equal(data.devices[0].apiKey,undefined);
  assert.equal(data.devices[0].history[0].access_token,undefined);
  assert.equal(r.headers.get("Cache-Control"),"private, no-store, max-age=0");
});
test("upstream failures, oversize responses, invalid JSON and HTML fail closed",async()=>{
  const cases=[
    async()=>legacyResponse({error:"server-secret"}, {status:403}),
    async()=>new Response("<html>SECRET</html>",{headers:{"Content-Type":"text/html"}}),
    async()=>new Response("{bad json",{headers:{"Content-Type":"application/json"}}),
    async()=>new Response(JSON.stringify({devices:[{blob:"x".repeat(4*1024*1024)}]}),
      {headers:{"Content-Type":"application/json"}})
  ];
  for(const fetchUpstream of cases){
    const result=await handleLegacyBrewingRequest(req("rapt/dashboard.php"),{
      verifyOwner:async()=>owner,fetchUpstream});
    assert.equal(result.status,502);
    assert.doesNotMatch(await result.text(),/SECRET|server-secret/i);
  }
});
test("sanitizer guards nested tokens",()=>{
  assert.deepEqual(redactLegacyPayload({apiKey:"x",nested:[{refresh_token:"y",ok:true}]}),
    {nested:[{ok:true}]});
});
