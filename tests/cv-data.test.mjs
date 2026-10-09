import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {renderCV,loadCV,portfolioInfoPageHTML} from "../src/portfolio/profile-pages.js";

const cv=JSON.parse(await readFile(new URL("../data/cv.json",import.meta.url),"utf8"));
test("CV data schema and unique entry IDs",()=>{
 assert.equal(cv.schemaVersion,1);
 assert.ok(cv.name);
 assert.ok(cv.experience.length>=3);
 for(const key of ["education","experience","projects","updates"]){
   const ids=(cv[key]||[]).map(item=>item.id);
   assert.equal(ids.length,new Set(ids).size);
 }
});
test("CV HTML escapes untrusted text and validates links",()=>{
 const html=renderCV({...cv,profile:'<img src=x onerror=alert(1)>',updates:[{id:"test",title:"Published",period:"2026",description:"Test",url:"javascript:alert(1)"}]});
 assert.ok(html.includes("&lt;img"));
 assert.ok(!html.includes('<img src=x'));
 assert.ok(!html.includes('href="javascript:'));
 assert.ok(html.includes("Recent updates"));
 assert.ok(html.includes("Experience"));
});
test("About and Contact reuse CV data",()=>{
 assert.ok(portfolioInfoPageHTML("about",cv).includes(cv.name));
 assert.ok(portfolioInfoPageHTML("contact",cv).includes(cv.email));
});
test("CV reads versioned JSON",async()=>{
 const result=await loadCV(async()=>({ok:true,json:async()=>cv}));
 assert.equal(result.name,cv.name);
 await assert.rejects(()=>loadCV(async()=>({ok:false,status:404})),/404/);
});
