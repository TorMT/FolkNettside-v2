import test from "node:test";
import assert from "node:assert/strict";
import {extension,fetchText} from "../src/viewers/utils.js";

test("extension handles nested paths, query fragments and extensionless paths",()=>{
 assert.equal(extension("./courses/5/notes.v2/week 1/lecture.PY?download=1#top"),"py");
 assert.equal(extension("https://example.org/5/notes/"),"");
 assert.equal(extension("C:\\course\\nested\\file.TSX"),"tsx");
 assert.equal(extension(".gitignore"),"gitignore");
});

test("streamed text preview handles chunk boundaries and enforces byte limit",async()=>{
 const original=globalThis.fetch;
 const makeResponse=chunks=>new Response(new ReadableStream({
   start(controller){for(const part of chunks)controller.enqueue(new TextEncoder().encode(part));controller.close()}
 }),{status:200});
 try{
   globalThis.fetch=async()=>makeResponse(["one\n","two\n"]);
   assert.equal(await fetchText("/lecture.txt"),"one\ntwo\n");
   globalThis.fetch=async()=>makeResponse(["ok","too long"]);
   await assert.rejects(()=>fetchText("/lecture.txt",{maxBytes:3}),/limit/);
   globalThis.fetch=async()=>new Response("missing",{status:404});
   await assert.rejects(()=>fetchText("/missing.txt"),/HTTP 404/);
 }finally{globalThis.fetch=original}
});
