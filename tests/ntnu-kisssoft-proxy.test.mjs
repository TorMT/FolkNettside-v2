import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {APPROVED_PUBLIC_KISSSOFT_PATHS,publicKisssoftRelayURL,PUBLIC_KISSSOFT_RELAY} from "../src/viewers/ntnu-kisssoft-proxy.js";
import {APPROVED_PUBLIC_KISSSOFT_PATHS as EDGE_ALLOWED} from "../supabase/functions/ntnu-kisssoft/core.js";
const HOST="https://tormt.folk.ntnu.no";
const mk=(path,patch={})=>({source:"ntnu",remoteArchive:true,
 url:HOST+path,name:path.split("/").pop(),...patch});
test("proxy can only request the four approved, public PitchSystem KISSsoft files",()=>{
 assert.deepEqual(APPROVED_PUBLIC_KISSSOFT_PATHS,EDGE_ALLOWED);
 const catalog=JSON.parse(readFileSync(new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
 const paths=new Set(catalog.semesters.flatMap(s=>s.courses.flatMap(c=>
  c.resources.filter(r=>/\.(?:z12|z14|z012|z014|z012rs|z014rs|w10|ksys)$/i.test(r.name))
   .map(r=>r.path))));
 assert.equal(APPROVED_PUBLIC_KISSSOFT_PATHS.length,4);
 for(const path of APPROVED_PUBLIC_KISSSOFT_PATHS){
  assert.ok(paths.has(path),"unindexed asset exposed: "+path);
  const url=publicKisssoftRelayURL(mk(path),{siteOrigin:"https://tormt.github.io"});
  assert.equal(url,PUBLIC_KISSSOFT_RELAY+"?path="+encodeURIComponent(path));
 }
});
test("do not proxy local blobs, invalid origins, private/unapproved files or NTNU same-origin",()=>{
 const valid=mk(APPROVED_PUBLIC_KISSSOFT_PATHS[0]);
 for(const patch of [
  {localPreview:true,path:"blob:https://tormt.github.io/test"},
  {remoteArchive:false},{source:"site"},
  {url:"https://evil.example"+APPROVED_PUBLIC_KISSSOFT_PATHS[0]},
  {url:valid.url+"?token=test"},
  {url:valid.url+"#fragment"},
  {url:HOST+"/semestre/5/private/filer/test.Z14"},
  {url:HOST+"/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Other.Z14"}
 ])assert.equal(publicKisssoftRelayURL({...valid,...patch},{siteOrigin:"https://tormt.github.io"}),null);
 assert.equal(publicKisssoftRelayURL(valid,{siteOrigin:HOST}),null);
 assert.equal(publicKisssoftRelayURL(valid,{siteOrigin:"https://evil.example"}),null);
});
