import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflow=readFileSync(new URL("../.github/workflows/ntnu-hourly-catalog.yml",
 import.meta.url),"utf8");

test("hourly crawler is also bootstrapped when its config/script changes on main",()=>{
 assert.match(workflow,/schedule:\s*\n[\s\S]*?cron: ['"]17 \* \* \* \*['"]/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/push:\s*\n\s*branches: \[main\]/);
 for(const source of [
  ".github/workflows/ntnu-hourly-catalog.yml",
  "config/ntnu-public-courses.json",
  "scripts/crawl_ntnu_public.py"
 ])assert.ok(workflow.includes("- \""+source+"\""),source);
});

test("catalog-only bot commit never recursively restarts scanner",()=>{
 const pushPaths=workflow.split("  push:")[1].split("\n\npermissions:")[0];
 assert.doesNotMatch(pushPaths,/data\/ntnu-autocatalog\.json/);
 assert.match(workflow,/git add -- data\/ntnu-autocatalog\.json/);
 assert.match(workflow,/workflow_dispatch/);
 assert.match(workflow,/cancel-in-progress: false/);
});
