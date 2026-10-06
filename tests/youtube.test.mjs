import test from "node:test";
import assert from "node:assert/strict";
import {youtubeVideoId} from "../src/viewers/adapters/youtube.js";

test("youtube id parser accepts common URL forms",()=>{
  assert.equal(youtubeVideoId("M7lc1UVf-VE"),"M7lc1UVf-VE");
  assert.equal(youtubeVideoId("https://youtu.be/M7lc1UVf-VE"),"M7lc1UVf-VE");
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=M7lc1UVf-VE"),"M7lc1UVf-VE");
  assert.equal(youtubeVideoId("https://www.youtube.com/embed/M7lc1UVf-VE"),"M7lc1UVf-VE");
  assert.equal(youtubeVideoId("https://www.youtube.com/shorts/M7lc1UVf-VE"),"M7lc1UVf-VE");
});

test("youtube id parser rejects unrelated URLs",()=>{
  assert.equal(youtubeVideoId("https://example.com/video"),null);
  assert.equal(youtubeVideoId("not-a-video"),null);
});
