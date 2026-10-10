import test from "node:test";
import assert from "node:assert/strict";
import {fetchText,fetchJSON} from "../src/viewers/utils.js";

async function withFetch(handler,run){
  const before=globalThis.fetch;
  globalThis.fetch=handler;
  try{return await run()}finally{globalThis.fetch=before}
}
test("bounded JSON preview parses normal notebook content and preserves split UTF-8 sequences",async()=>{
  const obj={cells:[{cell_type:"markdown",source:["Kjemi: å, ø og æ"]}],metadata:{}};
  const bytes=new TextEncoder().encode(JSON.stringify(obj));
  const divider=bytes.findIndex(x=>x>=128);
  const output=new ReadableStream({
    start(controller){
      controller.enqueue(bytes.slice(0,divider+1));
      controller.enqueue(bytes.slice(divider+1));
      controller.close();
    }
  });
  await withFetch(async()=>new Response(output,{status:200}),async()=>{
    assert.deepEqual(await fetchJSON("./fixture.ipynb"),obj);
  });
});
test("oversized JSON headers are rejected without parsing the payload",async()=>{
  let cancelled=false;
  const stream=new ReadableStream({cancel(){cancelled=true}});
  await withFetch(async()=>new Response(stream,{status:200,headers:{"content-length":"99999999"}}),
    async()=>{
      await assert.rejects(fetchJSON("./untrusted.json"),/32 MiB/);
      assert.equal(cancelled,true);
    });
});
test("unknown length streaming JSON is aborted at the configured byte budget",async()=>{
  const payload=new TextEncoder().encode('{"payload":"'+"X".repeat(250)+'"}');
  await withFetch(async()=>new Response(new ReadableStream({
    start(controller){controller.enqueue(payload);controller.close()}
  })),async()=>{
    await assert.rejects(fetchJSON("./unknown-size.json",{maxBytes:128}),/0 MiB|0\.00 MiB|0\.000|limit/);
  });
});
test("text preview retains an independent 8 MiB default and validates the byte budget",async()=>{
  await withFetch(async()=>new Response("text",{status:200}),async()=>{
    assert.equal(await fetchText("./lecture.txt"),"text");
    await assert.rejects(fetchJSON("./lecture.txt",{maxBytes:0}),/Invalid preview size limit/);
  });
});
