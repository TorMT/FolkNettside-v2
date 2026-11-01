import test from "node:test";
import assert from "node:assert/strict";
import {newDiveLog,createDiveEntry,addDiveEntry,deleteDiveEntry,mergeDiveLogs} from "../src/diverse/dive-log-model.js";
import {reconcileDiveLogLocalWrite} from "../src/diverse/dive-log-local-sync.js";

const at="2026-10-26T12:00:00.000Z";
const entry=(id,name,updatedAt=at)=>createDiveEntry({
 siteId:"synthetic",siteName:name,divedAt:"2026-10-20T12:00:00Z",
 maxDepthM:12,durationMinutes:40,notes:"Synthetic test only"
},{id,at:updatedAt});
const entries=(...rows)=>newDiveLog(rows);

test("two independent stale local tabs preserve both new dives",()=>{
 const a=entries(entry("a","Tab A")),b=entries(entry("b","Tab B"));
 const savedA=reconcileDiveLogLocalWrite(a,null,{previouslySeenRaw:null});
 const savedB=reconcileDiveLogLocalWrite(b,JSON.stringify(savedA),{previouslySeenRaw:null});
 assert.deepEqual(savedB.entries.map(row=>row.id),["a","b"]);
 assert.equal(b.entries.length,1,"The input remains unmodified");
});

test("a valid stale tab does not revive a deleted dive",()=>{
 const before=entries(entry("a","Original"));
 const deleted=deleteDiveEntry(before,"a","2026-10-26T13:00:00Z");
 const stale=addDiveEntry(before,entry("b","Unrelated later tab addition"));
 const merged=reconcileDiveLogLocalWrite(stale,JSON.stringify(deleted),{
  previouslySeenRaw:JSON.stringify(before)
 });
 assert.deepEqual(merged.entries.map(x=>x.id),["a","b"]);
 assert.equal(merged.entries.find(x=>x.id==="a").deleted,true);
 assert.deepEqual(Object.keys(merged.entries.find(x=>x.id==="a")).sort(),
  ["deleted","id","updatedAt"]);
 assert.equal(mergeDiveLogs(stale,deleted).entries.find(x=>x.id==="a").deleted,true);
});

test("explicitly removed profile is not silently recreated by another tab",()=>{
 const candidate=entries(entry("a","Attempted stale write"));
 assert.throws(()=>reconcileDiveLogLocalWrite(candidate,null,{
  previouslySeenRaw:JSON.stringify(newDiveLog())
 }),/removed in another tab/);
 assert.equal(reconcileDiveLogLocalWrite(candidate,null,{previouslySeenRaw:null}).entries.length,1);
});

test("corrupt history and invalid log shapes block writes without replacing bytes",()=>{
 const candidate=entries(entry("a","Safe"));
 assert.throws(()=>reconcileDiveLogLocalWrite(candidate,"{truncated",{}),/cannot be read/);
 assert.throws(()=>reconcileDiveLogLocalWrite(candidate,
  JSON.stringify({schemaVersion:1,entries:[{id:"a"}]})),/cannot be read/);
 assert.throws(()=>reconcileDiveLogLocalWrite({entries:[]},null),/Unsupported dive log/);
});

test("equal-time competing edits follow deterministic ID/timestamp merge",()=>{
 const first=entries(entry("a","First",at));
 const second=entries(entry("a","Second",at));
 const actual=reconcileDiveLogLocalWrite(second,JSON.stringify(first),{
  previouslySeenRaw:JSON.stringify(newDiveLog())
 });
 assert.deepEqual(actual,mergeDiveLogs(first,second));
});
