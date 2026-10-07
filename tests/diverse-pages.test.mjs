import test from "node:test";
import assert from "node:assert/strict";
import {SANDALEN_TOOLS_URL,sandalenPageHTML} from "../src/diverse/sandalen-page.js";

test("Sandalen native hub preserves external destinations and in-view tools bridge",()=>{
  const html=sandalenPageHTML();
  assert.match(html,/sandalengard\.no/);
  assert.match(html,/vinmonopolet\.no/);
  assert.match(html,/untappd\.com\/SandalenGrd/);
  assert.match(html,/sandalen-tools-frame/);
  assert.ok(html.includes(SANDALEN_TOOLS_URL));
  assert.match(html,/data-go="\/diverse"/);
});
