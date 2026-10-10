import test from "node:test";
import assert from "node:assert/strict";
import {createResourceNotices,resourceSnapshot} from "../src/courses/resource-updates.js";
import {renderTopShell} from "../src/shell/navigation.js";

const initial=[{id:5,courses:[
  {code:"TMR4182",resources:[{path:"./notes.pdf"}]},
  {code:"TMR4330",resources:[]}
]}];
function store(){
  const m=new Map();
  return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
test("First visit creates an unalarming baseline; only added files notify",()=>{
  const storage=store();
  const first=createResourceNotices(initial,storage);
  assert.equal(first.total,0,"Do not mark all files new on first visit");
  const updated=[{id:5,courses:[
    {code:"TMR4182",resources:[{path:"./notes.pdf"},{path:"./lecture-02.pdf"}]},
    {code:"TMR4330",resources:[{path:"./lab.docx"}]}
  ]}];
  const newVisit=createResourceNotices(updated,storage);
  assert.equal(newVisit.total,2);
  assert.equal(newVisit.count(5,"TMR4182"),1);
  assert.equal(newVisit.newResources(5,"TMR4330")[0].path,"./lab.docx");
  assert.match(renderTopShell("courses",{courseUpdates:newVisit.total}),/2 nye filer/);
  newVisit.acknowledge();
  assert.equal(newVisit.total,0);
  assert.equal(createResourceNotices(updated,storage).total,0);
});
test("Duplicate file IDs do not create double announcements and state is local-only",()=>{
  const snapshot=resourceSnapshot([{id:2,courses:[{code:"TMA4245",resources:[
    {path:"./A.pdf"},{path:"./A.pdf"},{path:"./B.pdf"}
  ]}]}]);
  assert.equal(snapshot.length,2);
  assert.equal(createResourceNotices(initial,store()).total,0);
});
test("Navigation does not render untrusted public course label or account display name as HTML",()=>{
  const html=renderTopShell("courses",{
    coursesLabel:"<img src=x onerror=alert(1)>",
    account:{status:"signed-in",profile:{name:"<svg onload=alert(1)>"}},
    courseUpdates:3
  });
  assert.doesNotMatch(html,/<img|<svg/i);
  assert.match(html,/&lt;img/);
  assert.match(html,/3 nye filer/);
});
