import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";

// The V2 Pages workflow also runs npm test. Run the Python migration
// inventory fixture suite there without changing the production workflow.
test("Migrated course source persists across SiteUpdater and Pages rebuilds",()=>{
  const run=spawnSync("python3",[
    "-m","unittest","discover","-s","tests",
    "-p","test_siteupdater_source.py","-v"
  ],{encoding:"utf8",timeout:30000});
  if(run.error?.code==="ENOENT"&&!process.env.CI)return;
  assert.equal(run.status,0,[run.error?.message,run.stdout,run.stderr].filter(Boolean).join("\\n"));
});

test("V1/V2 migration inventory Python regressions",()=>{
  const run=spawnSync("python3",[
    "-m","unittest","discover","-s","tests",
    "-p","test_migration_readiness.py","-v"
  ],{encoding:"utf8",timeout:30000});
  if(run.error?.code==="ENOENT"&&!process.env.CI)return;
  assert.equal(run.status,0,[run.error?.message,run.stdout,run.stderr].filter(Boolean).join("\n"));
});
