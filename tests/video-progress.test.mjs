import test from "node:test";
import assert from "node:assert/strict";
import {createProgressStore,resourceProgressId} from "../src/video/progress-store.js";

function memoryStorage(){
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
}

test("resource progress id prefers stable explicit id",()=>{
  assert.equal(resourceProgressId({id:"yt:abc",url:"https://example.com"}),"yt:abc");
  assert.equal(resourceProgressId({path:"./video.mp4"}),"./video.mp4");
});

test("progress store round-trips normalized state",()=>{
  const store=createProgressStore(memoryStorage());
  const resource={id:"video-1"};
  store.write(resource,{position:12.5,duration:100,watched:false,updatedAt:42});
  assert.deepEqual(store.read(resource),{position:12.5,duration:100,watched:false,updatedAt:42});
  store.clear(resource);
  assert.deepEqual(store.read(resource),{});
});

test("progress store is ready for alternate storage backends",()=>{
  const calls=[];
  const storage={
    getItem(){return null},
    setItem(key,value){calls.push([key,value])},
    removeItem(){}
  };
  const store=createProgressStore(storage);
  store.write({id:"shared-video"},{position:90,duration:100,watched:true});
  assert.equal(calls.length,1);
  assert.match(calls[0][0],/shared-video/);
});
