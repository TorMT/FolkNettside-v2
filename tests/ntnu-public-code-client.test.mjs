import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {APPROVED_PUBLIC_CODE_PATHS,isApprovedPublicCode,publicCodePreviewURL,PUBLIC_CODE_RELAY} from "../src/viewers/ntnu-public-code.js";
import {APPROVED_PUBLIC_CODE_PATHS as EDGE_ALLOWED} from "../supabase/functions/ntnu-public-code/core.js";
const NTNU="https://tormt.folk.ntnu.no";
const mk=(path,patch={})=>({source:"ntnu",remoteArchive:true,url:NTNU+path,
 path:NTNU+path,name:decodeURIComponent(path.split("/").at(-1)),...patch});
test("snapshot contains exactly the 176 currently reviewed public non-quiz code files",()=>{
 const catalog=JSON.parse(readFileSync(new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
 const extension=/\.(?:py|ipynb|md|txt|tex|json|js|mjs|html|htm|csv|tsv|psv|css|xml|yaml|yml)$/i;
 const files=new Set(catalog.semesters.flatMap(s=>s.courses.flatMap(c=>
  c.resources.filter(r=>extension.test(r.name)&&r.kind!=="QUIZ").map(r=>r.path))));
 assert.equal(APPROVED_PUBLIC_CODE_PATHS.length,176);
 assert.equal(new Set(APPROVED_PUBLIC_CODE_PATHS).size,176);
 assert.deepEqual(APPROVED_PUBLIC_CODE_PATHS,EDGE_ALLOWED);
 for(const path of APPROVED_PUBLIC_CODE_PATHS){
  assert.ok(files.has(path),"nonpublic path in relay: "+path);
  const source=mk(path);
  assert.equal(isApprovedPublicCode(source),true,path);
  assert.equal(publicCodePreviewURL(source,{siteOrigin:"https://tormt.github.io"}),
    PUBLIC_CODE_RELAY+"?path="+encodeURIComponent(path));
  assert.equal(publicCodePreviewURL(source,{siteOrigin:NTNU}),source.url);
 }
});
test("local downloaded copy, unapproved filenames, credentials and foreign sources never proxy",()=>{
 const allowed=APPROVED_PUBLIC_CODE_PATHS.find(p=>p.endsWith(".py"));
 const source=mk(allowed);
 for(const patch of [{remoteArchive:false},{source:"site"},{url:NTNU+allowed+"?token=1"},
   {url:"https://evil.example"+allowed},{url:NTNU+"/semestre/5/private/filer/file.py"},
   {name:"mismatch.py"},{url:NTNU+allowed+"#frag"}]){
  const changed={...source,...patch};
  assert.equal(isApprovedPublicCode(changed),false);
  assert.equal(publicCodePreviewURL(changed,{siteOrigin:"https://tormt.github.io"}),changed.url);
 }
 assert.equal(publicCodePreviewURL(mk(allowed,{localPreview:true,path:"blob:https://tormt.github.io/preview"}),{
  siteOrigin:"https://tormt.github.io"}),"blob:https://tormt.github.io/preview");
 assert.equal(publicCodePreviewURL(source,{siteOrigin:"https://evil.example"}),source.url);
});
test("all six source adapters use the shared allowlisted preview resolver",()=>{
 for(const name of ["text","python","notebook","latex","csv","html"]){
  const content=readFileSync(new URL("../src/viewers/adapters/"+name+".js",import.meta.url),"utf8");
  assert.match(content,/publicCodePreviewURL\(resource\)/,name);
 }
 const text=readFileSync(new URL("../src/viewers/adapters/text.js",import.meta.url),"utf8");
 assert.match(text,/extension\(resource\.name\|\|resource\.path\)/);
});
