import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDiverseCatalog,filterKokSites} from "../src/diverse/study-catalog-core.js";
const source=JSON.parse(readFileSync(new URL("../data/diverse/kok-sites.json",import.meta.url),"utf8"));
test("student catalog contains exact imported source-record count and provenance",()=>{
  const cat=validateDiverseCatalog(source,"kok");
  assert.equal(cat.verified,true);
  assert.equal(cat.items.length,30);
  assert.equal(cat.sourceUrl,"https://perrur.folk.ntnu.no/script.js");
  assert.equal(new Set(cat.items.map(item=>item.url)).size,30);
});
test("student directory retains descriptions, original scale and realistic cohorts",()=>{
  const cat=validateDiverseCatalog(source,"kok");
  assert.equal(cat.items.find(item=>item.name==="Jakobra").rating,7);
  assert.equal(cat.items.find(item=>item.name==="Jakobra").ratingScale,10);
  assert.match(cat.items.find(item=>item.name==="Jakobra").description,/biotek/);
  assert.equal(cat.items.find(item=>item.name==="Tormt").url,"https://folk.ntnu.no/tormt/");
  assert.ok(cat.items.every(item=>item.source.startsWith("https://perrur.folk.ntnu.no/")));
  assert.deepEqual(filterKokSites(cat.items,{cohort:"22"}).map(x=>x.name),["Vegargje"]);
});
