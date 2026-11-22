import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// The engine/status pill is one line on desktop. On a phone a long status (a file name,
// an error from a blocked CDN) made the whole page scroll sideways: at 390 px the model
// inspector overflowed by 41 px. It must wrap inside the narrow layout.
test("status pill wraps on narrow screens instead of widening the page",()=>{
  const css=readFileSync(new URL("../assets/style.css",import.meta.url),"utf8");
  const rule=css.match(/@media\(max-width:760px\)\{\.coolprop-engine-status\{([^}]*)\}/);
  assert.ok(rule,"narrow-screen rule for .coolprop-engine-status is missing");
  assert.match(rule[1],/white-space:normal/);
  assert.match(rule[1],/overflow-wrap:anywhere/);
  assert.match(rule[1],/max-width:100%/);
});
