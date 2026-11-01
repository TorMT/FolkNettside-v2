import test from "node:test";
import assert from "node:assert/strict";
import {createStudyProgressBackup,importStudyProgressBackup,isStudyProgressKey} from "../src/settings/study-progress-backup.js";

const storage=(initial={},failKey=null)=>{
 const data=new Map(Object.entries(initial));
 return {
  get length(){return data.size},
  key:i=>[...data.keys()][i]??null,
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   if(key===failKey)throw Error("Disk quota denied");
   data.set(key,String(value));
  },
  removeItem:key=>data.delete(key),
  dump:()=>Object.fromEntries(data)
 };
};
const video=(time,position=42)=>JSON.stringify({position,duration:120,watched:false,updatedAt:time});
const quiz=time=>JSON.stringify({version:1,quizVersion:2,current:1,answers:[0],completed:false,updatedAt:time});
const selected=JSON.stringify({version:2,ids:["q1","q3"]});

test("portable backup exports only study quiz/video records and round-trips",()=>{
 const from=storage({
  "folk-v2-video:/course/one":video(200),
  "folknet:quiz:/course/one":quiz(100),
  "folknet:quiz:/course/one:selected-questions.v1":selected,
  "folk-v2-settings":"private-settings",
  "folk-v2-dive-log-v1":"private-dive",
  "unrelated":"do not export"
 });
 const backup=createStudyProgressBackup(from,{now:new Date("2026-11-01T12:00:00Z")});
 assert.equal(backup.format,"folk-v2-study-progress");
 assert.equal(backup.schemaVersion,1);
 assert.equal(backup.exportedAt,"2026-11-01T12:00:00.000Z");
 assert.equal(backup.records.length,3);
 assert.deepEqual(backup.records.map(r=>r.key),
   [...backup.records.map(r=>r.key)].sort((a,b)=>a.localeCompare(b)));
 assert(!JSON.stringify(backup).includes("private-dive"));
 const dest=storage({"folk-v2-settings":"keep","folk-v2-dive-log-v1":"keep"});
 const result=importStudyProgressBackup(JSON.parse(JSON.stringify(backup)),dest);
 assert.deepEqual(result,{imported:3,skipped:0,unchanged:0});
 assert.equal(dest.getItem("folk-v2-settings"),"keep");
 assert.equal(dest.getItem("folk-v2-dive-log-v1"),"keep");
 assert.equal(dest.getItem("folk-v2-video:/course/one"),video(200));
 assert.equal(dest.getItem("folknet:quiz:/course/one:selected-questions.v1"),selected);
 assert.deepEqual(importStudyProgressBackup(backup,dest),{imported:0,skipped:0,unchanged:3});
});

test("newer quiz/video progress wins without overwriting newer or undated local choices",()=>{
 const dest=storage({
  "folk-v2-video:a":video(300,12),
  "folknet:quiz:b":quiz(100),
  "folknet:quiz:c:selected-questions.v1":selected
 });
 const backup=createStudyProgressBackup(storage({
  "folk-v2-video:a":video(200,44),
  "folknet:quiz:b":quiz(450),
  "folknet:quiz:c:selected-questions.v1":JSON.stringify({version:2,ids:["q2","q4"]})
 }));
 const result=importStudyProgressBackup(backup,dest);
 assert.deepEqual(result,{imported:1,skipped:2,unchanged:0});
 assert.equal(dest.getItem("folk-v2-video:a"),video(300,12));
 assert.equal(dest.getItem("folknet:quiz:b"),quiz(450));
 assert.equal(dest.getItem("folknet:quiz:c:selected-questions.v1"),selected);
});

test("untrusted export rejects duplicate, malformed, private and oversized records before any write",()=>{
 const dest=storage({"folk-v2-video:existing":video(10)});
 const good=createStudyProgressBackup(storage({"folk-v2-video:new":video(90)}));
 const invalid=[
  {...good,format:"unknown"},
  {...good,records:[...good.records,...good.records]},
  {...good,records:[...good.records,{key:"folk-v2-settings",value:"{}"}]},
  {...good,records:[...good.records,{key:"folknet:quiz:broken",value:"not-json"}]},
  {...good,records:[...good.records,{key:"folknet:quiz:array",value:"[]"}]},
  {...good,records:[...good.records,{key:"folk-v2-video:large",value:"x".repeat(160001)}]},
  {...good,records:Array.from({length:2501},(_,i)=>({key:"folknet:quiz:"+i,value:"{}"}))}
 ];
 for(const candidate of invalid){
  assert.throws(()=>importStudyProgressBackup(candidate,dest));
  assert.equal(dest.getItem("folk-v2-video:new"),null,
    "Invalid backup cannot partially import earlier valid records");
 }
 assert.equal(dest.getItem("folk-v2-video:existing"),video(10));
 assert.equal(isStudyProgressKey("folk-v2-video:"),false);
 assert.equal(isStudyProgressKey("folknet:quiz:../course"),true,
  "Legacy path-like quiz IDs are allowed as local keys; they are never URLs");
});

test("local malformed records are preserved and an import cannot overwrite them",()=>{
 const dst=storage({"folk-v2-video:a":"{unreadable"});
 const backup=createStudyProgressBackup(storage({"folk-v2-video:a":video(200)}));
 assert.deepEqual(importStudyProgressBackup(backup,dst),{imported:0,skipped:1,unchanged:0});
 assert.equal(dst.getItem("folk-v2-video:a"),"{unreadable");
});

test("write failure rolls back earlier records without clearing unrelated data",()=>{
 const backup=createStudyProgressBackup(storage({
  "folk-v2-video:a":video(200),
  "folk-v2-video:b":video(300)
 }));
 const dst=storage({"private":"keep"},"folk-v2-video:b");
 assert.throws(()=>importStudyProgressBackup(backup,dst),/import failed/i);
 assert.deepEqual(dst.dump(),{"private":"keep"});
});
