import test from "node:test";
import assert from "node:assert/strict";
import {LEGACY_DIVERSE_BRIDGES,legacyDiverseBridgeHTML} from "../src/diverse/legacy-bridge-page.js";

test("remaining preserved Diverse apps have v2 migration bridges",()=>{
  assert.deepEqual(Object.keys(LEGACY_DIVERSE_BRIDGES),["medisin","laos","andrekok"]);
  for(const [id,item] of Object.entries(LEGACY_DIVERSE_BRIDGES)){
    const html=legacyDiverseBridgeHTML(id);
    assert.match(item.legacyUrl,/^https:\/\//);
    assert.ok(html.includes(item.legacyUrl),id+" missing preserved source");
    assert.match(html,/legacy-diverse-frame/);
    assert.match(html,/data-go="\/diverse"/);
  }
});
