import test from "node:test";
import assert from "node:assert/strict";
import {fetchText,fetchBoundedBuffer} from "../src/viewers/utils.js";

test("failed text and binary previews never print URL tokens in UI-visible errors",async()=>{
 const oldFetch=globalThis.fetch;
 const target="https://untrusted.example/course.py?password=private123&token=abc";
 const responses=[];
 globalThis.fetch=async (url)=>{responses.push(url);return {ok:false,status:403}};
 try{
   for(const fn of [fetchText,fetchBoundedBuffer]){
     await assert.rejects(fn(target),error=>{
       assert.match(error.message,/HTTP 403/);
       assert.match(error.message,/file preview/);
       assert.doesNotMatch(error.message,/password|private123|token|abc|untrusted\.example/);
       return true;
     });
   }
   assert.deepEqual(responses,[target,target]);
 }finally{globalThis.fetch=oldFetch}
});
