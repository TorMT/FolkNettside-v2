import test from "node:test";
import assert from "node:assert/strict";
import {fetchText,fetchJSON,fetchBoundedBuffer} from "../src/viewers/utils.js";

async function withFetch(handler,run){
  const original=globalThis.fetch;
  globalThis.fetch=handler;
  try{return await run()}finally{globalThis.fetch=original}
}

test("text request times out and aborts when headers never arrive",async()=>{
  let aborted=false;
  await withFetch((_path,{signal})=>{
    signal.addEventListener("abort",()=>{aborted=true});
    return new Promise(()=>{});
  },async()=>{
    await assert.rejects(fetchText("/stalled.py",{idleTimeoutMs:15}),/timed out/);
  });
  assert.equal(aborted,true);
});

test("JSON read times out on a stalled stream after a first chunk",async()=>{
  let cancelled=false,aborted=false;
  const stream=new ReadableStream({
    start(controller){controller.enqueue(new TextEncoder().encode('{"key":'));},
    cancel(){cancelled=true}
  });
  await withFetch((_path,{signal})=>{
    signal.addEventListener("abort",()=>{aborted=true});
    return Promise.resolve(new Response(stream,{status:200}));
  },async()=>{
    await assert.rejects(fetchJSON("/stalled.ipynb",{idleTimeoutMs:15}),/timed out/);
  });
  assert.equal(aborted,true);
  assert.equal(cancelled,true);
});

test("binary preview times out when a streaming read hangs",async()=>{
  let aborted=false,cancelled=false;
  const stream=new ReadableStream({cancel(){cancelled=true}});
  await withFetch((_path,{signal})=>{
    signal.addEventListener("abort",()=>{aborted=true});
    return Promise.resolve(new Response(stream,{status:200}));
  },async()=>{
    await assert.rejects(fetchBoundedBuffer("/stalled.f3z",{idleTimeoutMs:15}),/timed out/);
  });
  assert.equal(aborted,true);
  assert.equal(cancelled,true);
});

test("binary fallback arrayBuffer is also bounded when no stream reader is available",async()=>{
  await withFetch(async()=>({ok:true,headers:new Headers(),body:null,
    arrayBuffer:()=>new Promise(()=>{})}),async()=>{
    await assert.rejects(fetchBoundedBuffer("/stalled.docx",{idleTimeoutMs:15}),/timed out/);
  });
});

test("idle budget validation is fail-closed, while fast previews retain original bytes",async()=>{
  let called=false;
  await withFetch(async()=>{called=true;return new Response("OK")},async()=>{
    await assert.rejects(fetchText("/file.txt",{idleTimeoutMs:0}),/Invalid preview idle timeout/);
    await assert.rejects(fetchBoundedBuffer("/file.bin",{idleTimeoutMs:300_001}),/Invalid preview idle timeout/);
    assert.equal(called,false);
    assert.equal(await fetchText("/file.txt",{idleTimeoutMs:500}),"OK");
    assert.deepEqual(new Uint8Array(await fetchBoundedBuffer("/file.bin",{idleTimeoutMs:500})),new TextEncoder().encode("OK"));
  });
});
