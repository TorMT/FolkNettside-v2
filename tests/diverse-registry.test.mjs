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
  assert.equal(diverseModule("matpris").status,"repair");
});

test("native Diverse modules all have routes",()=>{
  assert.ok(nativeDiverseModules().length>=2);
  assert.ok(nativeDiverseModules().every(item=>item.route));
});
