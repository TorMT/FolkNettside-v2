import test from "node:test";
import assert from "node:assert/strict";
import {courseExternalLinks,karakterwebUrl,normalizeCourseCode} from "../src/courses/external-links.js";

test("course codes normalize deterministically",()=>{
  assert.equal(normalizeCourseCode(" tmr4182 "),"TMR4182");
  assert.equal(normalizeCourseCode("TMA4245"),"TMA4245");
  assert.throws(()=>normalizeCourseCode("bad/code"),/Invalid course code/);
});

test("Karakterweb links are HTTPS and course-specific",()=>{
  assert.equal(karakterwebUrl("TMR4182"),"https://karakterweb.no/ntnu/TMR4182");
  const [link]=courseExternalLinks("TMR4182");
  assert.equal(link.id,"karakterweb");
  assert.equal(link.external,true);
  assert.match(link.description,/TMR4182/);
});
