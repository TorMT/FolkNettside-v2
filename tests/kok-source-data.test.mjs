import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDiverseCatalog,filterKokSites} from "../src/diverse/study-catalog-core.js";
const source=JSON.parse(readFileSync(new URL("../data/diverse/kok-sites.json",import.meta.url),"utf8"));

test("original AndreKokSider page has 29 sourced, uniquely identified records",()=>{
  const cat=validateDiverseCatalog(source,"kok");
  assert.equal(cat.verified,true);
  assert.equal(cat.items.length,29);
  assert.equal(cat.sourceUrl,"https://tormt.folk.ntnu.no/diverse/AndreKokSider/");
  assert.equal(new Set(cat.items.map(item=>item.url)).size,29);
  assert.equal(new Set(cat.items.map(item=>item.sourceId)).size,29);
  assert.ok(cat.items.every(item=>item.source==="https://tormt.folk.ntnu.no/diverse/AndreKokSider/"));
});
test("original study/rating/cohort data outrank the secondary directory",()=>{
  const cat=validateDiverseCatalog(source,"kok");
  assert.equal(cat.items.find(item=>item.name==="Erlesorl").rating,9);
  assert.equal(cat.items.find(item=>item.name==="Erlesorl").cohort,"24");
  assert.equal(cat.items.find(item=>item.name==="Jakobra").ratingScale,10);
  assert.equal(cat.items.find(item=>item.name==="Jakobra").study,"MTKJ");
  assert.equal(cat.items.find(item=>item.name==="Perrur").url,"https://folk.ntnu.no/perrur/");
  assert.ok(!cat.items.some(item=>item.name==="Tormt"));
  assert.deepEqual(filterKokSites(cat.items,{cohort:"22"}).map(x=>x.name),["Vegargje"]);
});
test("secondary descriptions keep attribution while catalog entries remain primary",()=>{
  const withDescription=source.items.filter(x=>x.description);
  assert.equal(withDescription.length,26);
  assert.ok(withDescription.every(x=>x.descriptionSource==="https://perrur.folk.ntnu.no/script.js"));
  assert.match(source.items.find(x=>x.name==="Jakobra").description,/biotek/);
});
