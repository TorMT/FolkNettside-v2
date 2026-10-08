import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/style.css",import.meta.url),"utf8");

test("document head never leaks literal escaped newline into body",()=>{
  assert.doesNotMatch(html,/>\\n</);
  assert.match(html,/<link rel="stylesheet" href="\.\/assets\/diverse\.css">\n<link rel="stylesheet" href="\.\/assets\/brewing\.css">/);
});

test("semester rail hides scrollbar across all viewport widths without disabling scrolling",()=>{
  const global=css.match(/\.semester-tabs\{([^}]+)\}/)?.[1]||"";
  assert.match(global,/overflow-x:\s*auto/);
  assert.match(global,/overflow-y:\s*hidden/);
  assert.match(global,/scrollbar-width:\s*none/);
  assert.match(css,/\.semester-tabs::-webkit-scrollbar\s*\{[^}]*display:\s*none/);
});
