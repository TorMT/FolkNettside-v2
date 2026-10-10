import test from "node:test";
import assert from "node:assert/strict";
import {
 OFFICE_LIMITS,validateOfficeArchive,limitedOfficeXML,assertOfficeWorksheetBounds
} from "../src/viewers/office-safety.js";
import {fetchBoundedBuffer} from "../src/viewers/utils.js";
const file=(name,size)=>({name,dir:false,_data:{uncompressedSize:size},
  async:async kind=>{assert.equal(kind,"uint8array");return new TextEncoder().encode("<xml/>")}});

test("Office preview rejects deceptive ZIP sizes and expansion bombs before reading XML",()=>{
 assert.throws(()=>validateOfficeArchive({files:{huge:file("word/document.xml",OFFICE_LIMITS.xmlBytes+1)}}),/XML part/);
 assert.throws(()=>validateOfficeArchive({files:{unknown:{name:"file.xml",dir:false,_data:{}}}}),/unknown expanded size/);
 const files=Object.fromEntries(Array.from({length:OFFICE_LIMITS.entries+1},(_,i)=>["f"+i,file("f"+i,1)]));
 assert.throws(()=>validateOfficeArchive({files}),/too many/);
 const media=Object.fromEntries(Array.from({length:3},(_,i)=>["m"+i,file("media/image"+i+".jpg",90_000_000)]));
 assert.throws(()=>validateOfficeArchive({files:media}),/expands beyond/);
 assert.ok(validateOfficeArchive({files:{ok:file("word/document.xml",6)}}));
});
test("Office XML size is checked against both declared and actual inflated size",async()=>{
 await assert.rejects(limitedOfficeXML(file("word/document.xml",OFFICE_LIMITS.xmlBytes+1)),/exceeds/);
 const liar=file("xl/sharedStrings.xml",3);
 liar.async=async()=>new Uint8Array(OFFICE_LIMITS.xmlBytes+1);
 await assert.rejects(limitedOfficeXML(liar),/exceeds/);
 assert.equal(await limitedOfficeXML(file("word/document.xml",6)),"<xml/>");
});
test("Excel worksheet grid budget prevents accidental massive table allocations",()=>{
 assert.doesNotThrow(()=>assertOfficeWorksheetBounds({rows:100,columns:30,cells:1500}));
 for(const bounds of [
  {rows:5001,columns:2,cells:10000},
  {rows:10,columns:16384,cells:10},
  {rows:500,columns:256,cells:50001},
  {rows:-1,columns:1,cells:1},
  {rows:0,columns:Infinity,cells:0}
 ])assert.throws(()=>assertOfficeWorksheetBounds(bounds),/preview grid limits/);
});
async function withFetch(handler,run){
 const original=globalThis.fetch;
 globalThis.fetch=handler;
 try{return await run()}finally{globalThis.fetch=original}
}
test("binary ZIP preview checks content-length and aborts unknown-length oversized streams",async()=>{
 let cancelled=false;
 await withFetch(async()=>new Response(new ReadableStream({cancel(){cancelled=true}}),{
  status:200,headers:{"content-length":"1000000"}
 }),async()=>await assert.rejects(fetchBoundedBuffer("./document.docx",{maxBytes:256}),/limit/));
 assert.equal(cancelled,true);
 await withFetch(async()=>new Response(new ReadableStream({
  start(ctrl){ctrl.enqueue(new Uint8Array(200));ctrl.enqueue(new Uint8Array(200));ctrl.close()}
 }),{status:200}),async()=>await assert.rejects(fetchBoundedBuffer("./unknown.zip",{maxBytes:256}),/limit/));
 await withFetch(async()=>new Response(new Uint8Array([1,2,3,4]),{status:200}),async()=>{
   assert.deepEqual([...new Uint8Array(await fetchBoundedBuffer("./ok.docx",{maxBytes:256}))],[1,2,3,4]);
 });
});
