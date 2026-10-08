import test from "node:test";
import assert from "node:assert/strict";
import {validateMedisinBackup,newMedisinBackup,mergeMedisinBackups} from "../src/platform/medisin-drive.js";
const entry=(id,at,durationSeconds=100)=>({id,updatedAt:at,durationSeconds});
test("new local MedisinTimer backup is versioned",()=>{
  const backup=newMedisinBackup([entry("a","2026-10-08T08:00:00Z")]);
  assert.equal(backup.schema,1);
  assert.equal(backup.entries.length,1);
});
test("conflicting records merge by newest timestamp without dropping unrelated entries",()=>{
  const local=newMedisinBackup([entry("a","2026-10-08T10:00:00Z",120),entry("b","2026-10-08T08:00:00Z")]);
  const remote=newMedisinBackup([entry("a","2026-10-08T09:00:00Z",90),entry("c","2026-10-08T07:00:00Z")]);
  const merged=mergeMedisinBackups(local,remote);
  assert.equal(merged.entries.length,3);
  assert.equal(merged.entries.find(x=>x.id==="a").durationSeconds,120);
});
test("invalid or excessive backups fail validation",()=>{
  assert.throws(()=>validateMedisinBackup({schema:2,entries:[]}));
  assert.throws(()=>newMedisinBackup([entry("x","not a date")]));
  assert.throws(()=>newMedisinBackup([entry("x","2026-10-08T08:00:00Z",-2)]));
});
