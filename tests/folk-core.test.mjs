import test from "node:test";
import assert from "node:assert/strict";
import {handleFolkCoreRequest,parseUserBearer} from "../supabase/functions/folk-core/core.js";
const token="aaa.bbb.ccc";
const make=(path="/functions/v1/folk-core/health",opts={})=>new Request(
  "https://example.supabase.co"+path,{...opts,headers:{
    Origin:"https://tormt.github.io",...opts.headers
  }});
test("auth-gated backend refuses missing or invalid Supabase JWT before exposing user",async()=>{
 let count=0;
 const verifyUser=async()=>{count++;return {id:"12345678-1234-1234-1234-123456789012"}};
 for(const auth of [null,"Bearer nope","Basic "+token,"Bearer "+token+"xyz!"]){
   const res=await handleFolkCoreRequest(make(undefined,{
     headers:{Authorization:auth||""}
   }),{verifyUser});
   assert.equal(res.status,401);
 }
 assert.equal(count,0);
 assert.equal(parseUserBearer("Bearer "+token),token);
});
test("validated session and health endpoints return only non-secret capability status",async()=>{
 const verifyUser=async()=>({id:"12345678-1234-1234-1234-123456789012"});
 const opts={headers:{Authorization:"Bearer "+token}};
 const a=await handleFolkCoreRequest(make(undefined,opts),{verifyUser});
 assert.equal(a.status,200);
 assert.equal((await a.json()).autodeskConnected,false);
 assert.equal(a.headers.get("access-control-allow-origin"),"https://tormt.github.io");
 const b=await handleFolkCoreRequest(make("/functions/v1/folk-core/session",opts),{verifyUser});
 const data=await b.json();
 assert.equal(data.connected,true);
 assert.equal(data.userId,"12345678-1234-1234-1234-123456789012");
 assert.equal(data.storageBucket,"folk-private");
 assert.equal(JSON.stringify(data).includes(token),false);
});
test("origin deny and CORS preflight protect GitHub Pages without requiring a JWT for OPTIONS",async()=>{
 let verified=0;
 const verifyUser=async()=>{verified++;return {}};
 const bad=await handleFolkCoreRequest(new Request("https://api.test/functions/v1/folk-core/health",{
   headers:{Origin:"https://evil.example",Authorization:"Bearer "+token}
 }),{verifyUser});
 assert.equal(bad.status,403);
 assert.equal(verified,0);
 const ok=await handleFolkCoreRequest(make(undefined,{method:"OPTIONS"}),{verifyUser});
 assert.equal(ok.status,204);
 assert.equal(ok.headers.get("access-control-allow-methods"),"GET, OPTIONS");
});
test("no mutation, unknown routes, expired user or upstream outage",async()=>{
 const opt={headers:{Authorization:"Bearer "+token}};
 const denied=await handleFolkCoreRequest(make(undefined,{...opt,method:"POST"}),{});
 assert.equal(denied.status,405);
 const missing=await handleFolkCoreRequest(make("/functions/v1/folk-core/bad",opt),{});
 assert.equal(missing.status,404);
 const expired=await handleFolkCoreRequest(make(undefined,opt),{verifyUser:async()=>null});
 assert.equal(expired.status,401);
 const outage=await handleFolkCoreRequest(make(undefined,opt),{
   verifyUser:async()=>{throw Error("secret upstream response")}
 });
 assert.equal(outage.status,503);
 assert.doesNotMatch(await outage.text(),/secret upstream response/);
});
