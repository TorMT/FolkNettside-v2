import test from "node:test";
import assert from "node:assert/strict";
import {newMedisinBackup,mergeMedisinBackups} from "../src/platform/medisin-drive.js";
import {reconcileMedisinLocalWrite} from "../src/diverse/medisin-local-sync.js";

const at="2026-10-26T12:00:00.000Z";
const timer=(id,name,updatedAt=at)=>({
  id,type:"timer",name,durationSeconds:86400,halfLifeSeconds:7200,
  amount:1,unit:"mg",updatedAt,createdAt:at
});
const b=(...entries)=>newMedisinBackup(entries);

test("two independent stale tabs keep both synthetic timers in sequential commits",()=>{
  const empty=b();
  const fromTabA=b(timer("A","Tab A"));
  const first=reconcileMedisinLocalWrite(fromTabA,null,{previouslySeenRaw:null});
  const fromTabB=b(timer("B","Tab B"));
  const second=reconcileMedisinLocalWrite(fromTabB,JSON.stringify(first),{previouslySeenRaw:null});
  assert.deepEqual(second.entries.map(e=>e.id),["A","B"]);
  assert.deepEqual(empty.entries,[]);
});

test("a stale tab cannot resurrect a tombstoned dose or hide another tab's edits",()=>{
  const original=b(timer("A","Original"));
  const tombstoned=b({...timer("A","Original","2026-10-26T13:00:00Z"),deleted:true});
  const fromOldTab=b(timer("A","Original"),timer("C","Added in stale tab"));
  const merged=reconcileMedisinLocalWrite(fromOldTab,JSON.stringify(tombstoned),{
    previouslySeenRaw:JSON.stringify(original)
  });
  assert.deepEqual(merged.entries.map(x=>x.id),["A","C"]);
  assert.equal(merged.entries.find(x=>x.id==="A").deleted,true);
});

test("simulated unrelated browser removal and corrupt stored JSON prevent overwrite",()=>{
  const incoming=b(timer("A","Test"));
  assert.throws(()=>reconcileMedisinLocalWrite(incoming,null,{previouslySeenRaw:JSON.stringify(b())}),/fjernet/);
  assert.throws(()=>reconcileMedisinLocalWrite(incoming,'{invalid-json',{previouslySeenRaw:null}),/kan ikke leses/);
  assert.throws(()=>reconcileMedisinLocalWrite(incoming,
    JSON.stringify({schema:1,entries:[{type:"timer",id:"A"}]})),/kan ikke leses/);
  assert.deepEqual(reconcileMedisinLocalWrite(incoming,null,{previouslySeenRaw:null}).entries.map(e=>e.id),["A"]);
});

test("equal-time contradictory updates are deterministic across both stale tabs",()=>{
  const old=b(timer("A","Name A",at));
  const newState=b(timer("A","Name B",at));
  const result=reconcileMedisinLocalWrite(newState,JSON.stringify(old),{
    previouslySeenRaw:JSON.stringify(b())
  });
  assert.deepEqual(result.entries,mergeMedisinBackups(old,newState).entries);
  assert.equal(result.entries.length,1);
});
