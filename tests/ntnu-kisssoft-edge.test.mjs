import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_PUBLIC_KISSSOFT_PATHS,handlePublicKisssoftRequest,resolvePublicKisssoftPath} from "../supabase/functions/ntnu-kisssoft/core.js";
const base="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-kisssoft";
const path=APPROVED_PUBLIC_KISSSOFT_PATHS[2];
const url=base+"?path="+encodeURIComponent(path);
const sample=new TextEncoder().encode("KSOFTVERSION=2026\nMODULE=Z014\nZR[0].z=25\n");
const request=(target=url,{origin="https://tormt.github.io",method="GET"}={})=>
 new Request(target,{method,headers:{Origin:origin}});
test("only exact reviewed files, GET and allowed browser origins can read",async()=>{
 assert.equal(resolvePublicKisssoftPath(url),path);
 let calls=0;
 const fetchUpstream=async(target,options)=>{
  calls++;assert.equal(target,"https://tormt.folk.ntnu.no"+path);
  assert.equal(options.method,"GET");assert.equal(options.redirect,"error");
  assert.equal(options.credentials,"omit");assert.ok(!options.headers.Authorization);
  return new Response(sample,{headers:{"content-type":"application/octet-stream"}});
 };
 const okay=await handlePublicKisssoftRequest(request(),{fetchUpstream});
 assert.equal(okay.status,200);
 assert.equal(okay.headers.get("access-control-allow-origin"),"https://tormt.github.io");
 assert.deepEqual(new Uint8Array(await okay.arrayBuffer()),sample);
 assert.equal(calls,1);
 for(const target of [base+"?path="+encodeURIComponent("/semestre/5/private/file.Z14"),
  url+"&redirect=https://evil.example",base+"?url=https://evil.example",
  base+"?path="+encodeURIComponent(path+"/../secret.Z14")]){
  assert.equal((await handlePublicKisssoftRequest(request(target),{fetchUpstream})).status,404);
 }
 assert.equal(calls,1,"unapproved requests must not reach NTNU");
 const forbidden=await handlePublicKisssoftRequest(request(url,{origin:"https://attacker.example"}),{fetchUpstream});
 assert.equal(forbidden.status,403);assert.equal(forbidden.headers.get("access-control-allow-origin"),null);
 const post=await handlePublicKisssoftRequest(request(url,{method:"POST"}),{fetchUpstream});
 assert.equal(post.status,405);assert.equal(calls,1);
 const preflight=await handlePublicKisssoftRequest(request(url,{method:"OPTIONS"}),{fetchUpstream});
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get("access-control-allow-origin"),"https://tormt.github.io");
});
test("HTML login pages, upstream errors and oversized files are rejected without leaking bytes",async()=>{
 const respond=body=>()=>Promise.resolve(body);
 assert.equal((await handlePublicKisssoftRequest(request(),{fetchUpstream:respond(new Response("<html>private</html>",{headers:{"content-type":"text/html"}}))})).status,502);
 assert.equal((await handlePublicKisssoftRequest(request(),{fetchUpstream:respond(new Response("denied",{status:403}))})).status,502);
 assert.equal((await handlePublicKisssoftRequest(request(),{fetchUpstream:respond(new Response(sample,{headers:{"content-length":"12000001"}}))})).status,413);
 const huge=new Uint8Array(12_000_001);
 const oversized=await handlePublicKisssoftRequest(request(),{fetchUpstream:respond(new Response(huge))});
 assert.equal(oversized.status,413);
 assert.equal(oversized.headers.get("cache-control"),"no-store");
});
