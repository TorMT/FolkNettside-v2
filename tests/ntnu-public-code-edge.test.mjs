import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_PUBLIC_CODE_PATHS,resolvePublicCodePath,handlePublicCodeRequest} from "../supabase/functions/ntnu-public-code/core.js";
const ROOT="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-public-code";
const path=APPROVED_PUBLIC_CODE_PATHS.find(s=>s.endsWith(".py"));
const url=ROOT+"?path="+encodeURIComponent(path);
const req=(target=url,{method="GET",origin="https://tormt.github.io"}={})=>
 new Request(target,{method,headers:{Origin:origin}});
test("proxy only fetches exact approved NTNU path without client credentials",async()=>{
 assert.equal(resolvePublicCodePath(url),path);
 let calls=0;const fetchUpstream=async(target,opts)=>{
  calls++;assert.equal(target,"https://tormt.folk.ntnu.no"+path);
  assert.equal(opts.method,"GET");assert.equal(opts.redirect,"error");
  assert.equal(opts.credentials,"omit");assert.equal(opts.headers.Authorization,undefined);
  return new Response("print(123)\n",{headers:{"content-type":"text/plain"}});
 };
 const response=await handlePublicCodeRequest(req(),{fetchUpstream});
 assert.equal(response.status,200);
 assert.equal(response.headers.get("access-control-allow-origin"),"https://tormt.github.io");
 assert.equal(await response.text(),"print(123)\n");
 for(const target of [ROOT+"?path="+encodeURIComponent("/semestre/1/private/a.py"),
  ROOT+"?url=https://evil.example",url+"&other=1",ROOT+"?path="+encodeURIComponent(path+"../private.py")])
  assert.equal((await handlePublicCodeRequest(req(target),{fetchUpstream})).status,404);
 assert.equal(calls,1);
 assert.equal((await handlePublicCodeRequest(req(url,{method:"POST"}),{fetchUpstream})).status,405);
 assert.equal((await handlePublicCodeRequest(req(url,{origin:"https://evil.example"}),{fetchUpstream})).status,403);
 assert.equal(calls,1);
 const preflight=await handlePublicCodeRequest(req(url,{method:"OPTIONS"}),{fetchUpstream});
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get("access-control-allow-origin"),"https://tormt.github.io");
});
test("upstream login/error and oversized source are rejected",async()=>{
 const serve=response=>async()=>response;
 const check=async(response)=>handlePublicCodeRequest(req(),{fetchUpstream:serve(response)});
 assert.equal((await check(new Response("<html>private</html>",{headers:{"content-type":"text/html"}}))).status,502);
 assert.equal((await check(new Response("<!doctype html>oops",{headers:{"content-type":"text/plain"}}))).status,502);
 assert.equal((await check(new Response("Forbidden",{status:403}))).status,502);
 assert.equal((await check(new Response("large",{headers:{"content-length":"16000001"}}))).status,413);
 assert.equal((await check(new Response(new Uint8Array(16_000_001)))).status,413);
 const notebook=APPROVED_PUBLIC_CODE_PATHS.find(s=>s.endsWith(".ipynb"));
 const nb=await handlePublicCodeRequest(req(ROOT+"?path="+encodeURIComponent(notebook)),{
  fetchUpstream:serve(new Response('{"cells":[]}',{headers:{"content-type":"application/json"}}))
 });
 assert.equal(nb.status,200);
 assert.equal(await nb.text(),'{"cells":[]}');
});
