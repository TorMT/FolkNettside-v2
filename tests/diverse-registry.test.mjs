import test from "node:test";
import assert from "node:assert/strict";
import {DIVERSE_MODULES,diverseModule,nativeDiverseModules} from "../src/diverse/diverse-registry.js";

test("Diverse inventory preserves every live legacy tab discovered during migration",()=>{
  const ids=new Set(DIVERSE_MODULES.map(item=>item.id));
  for(const id of ["diving","brewing","njord","sandalen","medisin","laos","andrekok","matpris","leseravnen"]){
    assert.ok(ids.has(id),`missing Diverse module: ${id}`);
  }
});

test("Dive map is native, Njord points into Engineering and LeseRavnen remains preserved",()=>{
  assert.equal(diverseModule("diving").route,"/diverse/diving");
  assert.equal(diverseModule("diving").status,"native");
  assert.equal(diverseModule("njord").route,"/engineering");
  assert.equal(diverseModule("njord").status,"superseded");
  assert.equal(diverseModule("leseravnen").status,"preserved");
  assert.match(diverseModule("leseravnen").legacyUrl,/LeseRavnen/);
  assert.equal(diverseModule("matpris").status,"migration");
  assert.equal(diverseModule("matpris").route,"/diverse/matpris");
  assert.equal(diverseModule("sandalen").route,"/diverse/sandalen");
  assert.equal(diverseModule("brewing").route,"/diverse/brewing");
  assert.equal(diverseModule("brewing").status,"native");
  assert.equal(diverseModule("brewing").sync,"site-google-session");
  assert.equal(diverseModule("diving").sync,"site-google-session");
  assert.equal(diverseModule("medisin").route,"/diverse/medisin");
  assert.equal(diverseModule("medisin").storage,"local+google-drive");
  assert.equal(diverseModule("medisin").sync,"site-google-session");
  assert.equal(diverseModule("laos").route,"/diverse/laos");
  assert.equal(diverseModule("andrekok").route,"/diverse/andrekok");
});

test("native Diverse modules all have routes",()=>{
  assert.ok(nativeDiverseModules().length>=2);
  assert.ok(nativeDiverseModules().every(item=>item.route));
});
