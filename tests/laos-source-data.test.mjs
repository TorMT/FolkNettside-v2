import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {validateDiverseCatalog,safeCatalogUrl} from "../src/diverse/study-catalog-core.js";

const manifest=JSON.parse(readFileSync(new URL("../data/diverse/laos-assignments.json",import.meta.url),"utf8"));
const expected=new Set(["Gruppemodul_MTKJ.pdf","Refleksjon Lab Del.pdf","Refleksjon Øving Del.pdf"]);
test("LAOS native catalog mirrors all three public files from its source index",()=>{
  const normalized=validateDiverseCatalog(manifest,"laos");
  assert.equal(normalized.verified,true);
  assert.equal(normalized.items.length,3);
  assert.equal(normalized.sourceUrl,"https://tormt.folk.ntnu.no/diverse/LAOS/filer/index.json");
  const names=new Set(manifest.items.map(x=>decodeURIComponent(x.url.split("/").at(-1))));
  assert.deepEqual(names,expected);
});
test("each mirrored LAOS PDF has authentic PDF magic and matches a pinned SHA-256",()=>{
  for(const item of manifest.items){
    const path=decodeURIComponent(item.url.replace(/^\.\//,""));
    const blob=readFileSync(new URL("../"+path,import.meta.url));
    assert.equal(blob.subarray(0,5).toString("ascii"),"%PDF-");
    assert.equal(createHash("sha256").update(blob).digest("hex"),item.sha256);
    assert.ok(item.source.startsWith("https://tormt.folk.ntnu.no/diverse/LAOS/filer/"));
  }
});
test("local LAOS URLs are accepted only under explicitly permitted relative mode",()=>{
  const relative="./data/diverse/laos-files/Gruppemodul_MTKJ.pdf";
  assert.equal(safeCatalogUrl(relative),"");
  assert.equal(safeCatalogUrl(relative,{allowRelative:true}),relative);
  assert.equal(safeCatalogUrl("//evil.example",{allowRelative:true}),"");
});
