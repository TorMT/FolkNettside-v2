import test from "node:test";
import assert from "node:assert/strict";
import {
  newInventory,importInventory,upsertInventory,deleteInventory,
  mergeInventory,visibleInventory,validateInventory,ingredientId
} from "../src/diverse/brewing/inventory-model.js";
import {
  newDiveLog,createDiveEntry,addDiveEntry,deleteDiveEntry,
  mergeDiveLogs,visibleDiveEntries,validateDiveLog
} from "../src/diverse/dive-log-model.js";

const ingredient={name:"Malt",quantity:5,unit:"kg"};
test("inventory migrates legacy schema 1 and merges independent edits and tombstones",()=>{
 const old=importInventory({schemaVersion:1,items:[ingredient]},"2026-10-10T09:00:00Z");
 assert.equal(visibleInventory(old).length,1);
 const other=upsertInventory(newInventory(),{name:"Hops",quantity:0.4,unit:"kg"},"2026-10-10T09:01:00Z");
 const merged=mergeInventory(old,other);
 assert.equal(visibleInventory(merged).length,2);
 const removed=deleteInventory(merged,ingredientId(ingredient),"2026-10-10T09:02:00Z");
 assert.equal(visibleInventory(mergeInventory(old,removed)).length,1);
 assert.equal(visibleInventory(mergeInventory(removed,old)).length,1);
 assert.throws(()=>validateInventory({schemaVersion:2,entries:[...old.entries,...old.entries]}),/duplicate/);
});
test("inventory validates quantities and restores deleted rows only with later edits",()=>{
 const old=upsertInventory(newInventory(),ingredient,"2026-10-10T10:00:00Z");
 const deleted=deleteInventory(old,ingredientId(ingredient),"2026-10-10T11:00:00Z");
 const edited=upsertInventory(old,{...ingredient,quantity:7},"2026-10-10T12:00:00Z");
 assert.equal(visibleInventory(mergeInventory(deleted,edited))[0].quantity,7);
 assert.throws(()=>upsertInventory(old,{...ingredient,quantity:-1}),/Quantity/);
});
const dive={siteName:"Korsvika",siteId:"P1",divedAt:"2026-09-23T12:00:00Z",maxDepthM:16,durationMinutes:42,notes:"Synthetic test record"};
test("dive log imports, merges and preserves deletion tombstones",()=>{
 const first=createDiveEntry(dive,{id:"dive-01",at:"2026-10-10T10:00:00Z"});
 const second=createDiveEntry({...dive,siteName:"Flakk"},{id:"dive-02",at:"2026-10-10T11:00:00Z"});
 const a=addDiveEntry(newDiveLog(),first),b=addDiveEntry(newDiveLog(),second);
 assert.equal(visibleDiveEntries(mergeDiveLogs(a,b)).length,2);
 const removed=deleteDiveEntry(a,"dive-01","2026-10-10T12:00:00Z");
 assert.equal(visibleDiveEntries(mergeDiveLogs(removed,a)).length,0);
 assert.equal(visibleDiveEntries(mergeDiveLogs(a,removed)).length,0);
 assert.deepEqual(Object.keys(removed.entries[0]).sort(),["deleted","id","updatedAt"]);
 assert.throws(()=>validateDiveLog({schemaVersion:1,entries:[first,first]}),/Duplicate/);
});
test("dive records validate depth, timestamp and duration",()=>{
 assert.throws(()=>createDiveEntry({...dive,maxDepthM:-1}),/Invalid dive fields/);
 assert.throws(()=>createDiveEntry({...dive,durationMinutes:0}),/Invalid dive fields/);
 assert.throws(()=>createDiveEntry({...dive,notes:"a".repeat(2001)}),/Invalid dive fields/);
});
