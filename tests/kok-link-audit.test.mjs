import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDiverseCatalog} from "../src/diverse/study-catalog-core.js";
import {
  validateStudyLinkAudit,studyLinkObservation,studyLinkAuditSummary
} from "../src/diverse/catalog-link-audit.js";

const original=JSON.parse(readFileSync(new URL("../data/diverse/kok-sites.json",import.meta.url),"utf8"));
const snapshot=JSON.parse(readFileSync(new URL("../data/diverse/kok-link-audit-2026-10-26.json",import.meta.url),"utf8"));
const published=validateDiverseCatalog(original,"kok");

test("dated public link audit maps all 29 historic sites without modifying source URLs",()=>{
  const result=validateStudyLinkAudit(snapshot,published.items);
  assert.equal(snapshot.checkedOn,"2026-10-26");
  assert.equal(result.byUrl.size,29);
  assert.deepEqual(result.summary,{responded:25,http_410:3,inconclusive:1});
  assert.deepEqual([...result.byUrl.entries()].filter(([,value])=>value==="http_410").map(([url])=>url),[
    "https://folk.ntnu.no/erlesorl/",
    "https://folk.ntnu.no/jakobra/",
    "https://folk.ntnu.no/aleksaci/"
  ]);
  assert.equal(result.byUrl.get("https://folk.ntnu.no/pauljg/"),"inconclusive");
  assert.match(studyLinkObservation(result,"https://folk.ntnu.no/erlesorl/"),/HTTP 410/);
  assert.match(studyLinkObservation(result,"https://folk.ntnu.no/pauljg/"),/uavklart/);
  assert.equal(studyLinkObservation(result,"https://folk.ntnu.no/perrur/"),null);
  assert.match(studyLinkAuditSummary(result),/25 svarte, 3 ga HTTP 410, 1 uavklart/);
  assert.equal(snapshot.laos.indexObservation,"responded");
  assert.equal(published.items.find(x=>x.name==="Erlesorl").url,
    "https://folk.ntnu.no/erlesorl/","Historical source URL must remain clickable");
});

test("wrong or malicious/stale-inconsistent status artifacts are not trusted",()=>{
  assert.throws(()=>validateStudyLinkAudit({...snapshot,checkedOn:"nonsense"},published.items));
  assert.throws(()=>validateStudyLinkAudit({...snapshot,entries:[...snapshot.entries.slice(1),snapshot.entries[1]]},published.items));
  assert.throws(()=>validateStudyLinkAudit({...snapshot,summary:{...snapshot.summary,responded:100}},published.items));
  assert.throws(()=>validateStudyLinkAudit({...snapshot,entries:snapshot.entries.map((x,i)=>i===0?{...x,url:"javascript:alert(1)"}:x)},published.items));
  assert.throws(()=>validateStudyLinkAudit({...snapshot,entries:snapshot.entries.map((x,i)=>i===0?{...x,observation:"dead_forever"}:x)},published.items));
  assert.throws(()=>validateStudyLinkAudit(snapshot,published.items.slice(0,28)));
});
