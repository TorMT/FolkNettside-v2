import test from "node:test";
import assert from "node:assert/strict";
import {newMedisinBackup,mergeMedisinBackups} from "../src/platform/medisin-drive.js";
import {medisinCreateTimer,medisinCreateDose,medisinDoses,medisinRemainingLevel,medisinNextAt,medisinApply,medisinDelete,medisinStorageKey,medisinTimers} from "../src/diverse/medisin-model.js";
import {medisinPageHTML} from "../src/diverse/medisin-page.js";

const t0="2026-10-08T08:00:00.000Z";
function example(){
  const timer=medisinCreateTimer({id:"timer1",name:"Test",intervalHours:24,halfLifeHours:2,amount:100,unit:"mg",at:t0});
  const dose={...medisinCreateDose(timer,{id:"dose1",takenAt:t0}),updatedAt:t0};
  return {timer,backup:newMedisinBackup([timer,dose])};
}
test("dose history and elapsed interval are independent of UI rendering",()=>{
  const {backup}=example();
  assert.equal(medisinDoses(backup,"timer1").length,1);
  assert.equal(medisinNextAt(backup,"timer1"),Date.parse(t0)+24*3600000);
});
test("half-life model gives exactly half after one half-life",()=>{
  const {backup}=example();
  assert.ok(Math.abs(medisinRemainingLevel(backup,"timer1",Date.parse(t0)+7200000)-50)<1e-9);
  assert.equal(medisinRemainingLevel(backup,"timer1",Date.parse(t0)-1),0);
});
test("deletions survive remote merges using tombstones",()=>{
  const {backup}=example();
  const deleted=medisinDelete(backup,"dose1","2026-10-08T12:00:00.000Z");
  assert.equal(medisinDoses(deleted,"timer1").length,0);
  const merged=mergeMedisinBackups(deleted,backup);
  assert.equal(medisinDoses(merged,"timer1").length,0);
});
test("new timer and dose IDs remain separate and are merged",()=>{
  const {backup}=example();
  const newer=medisinApply(backup,{id:"dose2",type:"dose",timerId:"timer1",takenAt:t0,amount:100,unit:"mg",durationSeconds:0,updatedAt:"2026-10-08T09:00:00Z"});
  assert.equal(medisinDoses(newer,"timer1").length,2);
});
test("Google account storage namespaces are distinct from guest mode",()=>{
  assert.notEqual(medisinStorageKey("account-1"),medisinStorageKey("account-2"));
  assert.notEqual(medisinStorageKey("account-1"),medisinStorageKey(""));
});
test("native module retains explicit legacy calculator fallback",()=>{
  const html=medisinPageHTML();
  assert.match(html,/id="medisin-add-form"/);
  assert.match(html,/id="medisin-sync"/);
  assert.match(html,/Gammel versjon/);
  assert.doesNotMatch(html,/legacy-diverse-frame/);
});
test("invalid user-supplied interval is rejected",()=>{
  assert.throws(()=>medisinCreateTimer({id:"x",name:"X",intervalHours:-1,halfLifeHours:2,amount:1,unit:"mg"}));
  const {backup}=example();
  assert.equal(medisinTimers(backup).length,1);
});
