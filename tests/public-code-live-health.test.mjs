import test from "node:test";
import assert from "node:assert/strict";
import {auditPublicCodeRelay} from "../scripts/audit_public_code_relay.mjs";

const PAGE="https://tormt.github.io";
const success=(status,origin,contentType="text/plain; charset=utf-8")=>
 new Response("PUBLIC TEST",{
   status,headers:{
    ...(origin?{"access-control-allow-origin":origin}:{}),
    "content-type":contentType
   }
 });
test("public relay health gate checks exact allowlist and browser CORS on GET",async()=>{
 const calls=[];
 const report=await auditPublicCodeRelay({fetchImpl:async(uri,options)=>{
   const u=new URL(uri);const path=u.searchParams.get("path");
   calls.push({path,method:options.method,origin:options.headers.Origin});
   assert.equal(u.hostname,"aeuouzkiyddfjtjfdosp.supabase.co");
   assert.equal(options.redirect,"error");
   if(options.headers.Origin!==PAGE)return success(403,null,"application/json");
   if(path.endsWith("/not-approved.py"))return success(404,PAGE,"application/json");
   return success(200,PAGE);
 }});
 assert.deepEqual(report,{approvedGET:2,deniedPath:true,deniedOrigin:true});
 assert.equal(calls.length,4);
 assert.equal(calls[0].method,"GET");
 assert.ok(calls[1].path.endsWith(".ipynb"));
 assert.ok(calls[2].path.endsWith("not-approved.py"));
 assert.equal(calls[3].origin,"https://not-an-approved-origin.example");
});
test("a redirect, unexpected MIME type, or permissive CORS fails closed",async()=>{
 for(const response of [
   success(200,null),success(200,PAGE,"text/html"),
   success(502,PAGE)
 ]){
   await assert.rejects(auditPublicCodeRelay({fetchImpl:async()=>response.clone()}),
     /Approved public source GET\/CORS check failed/);
 }
});
test("unapproved path must be 404 and origin must be forbidden",async()=>{
 const fetchImpl=async(url,options)=>{
   if(options.headers.Origin!==PAGE)return success(200,PAGE);
   if(new URL(url).searchParams.get("path").endsWith("not-approved.py"))
     return success(200,PAGE);
   return success(200,PAGE);
 };
 await assert.rejects(auditPublicCodeRelay({fetchImpl}),/Unapproved path denial/);
});
