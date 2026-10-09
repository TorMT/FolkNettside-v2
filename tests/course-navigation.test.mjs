import test from "node:test";
import assert from "node:assert/strict";
import {chooseCourseSection} from "../src/courses/course-navigation.js";

const regions=(top0,top1,top2)=>[
 {id:"overview",top:top0},{id:"section-0",top:top1},{id:"section-1",top:top2}
];

test("Course highlight picks the section above the viewport anchor, not IntersectionObserver entry order",()=>{
 assert.equal(chooseCourseSection(regions(-400,72,730),"overview",82), "overview");
 assert.equal(chooseCourseSection(regions(-400,35,700),"overview",82), "section-0");
 assert.equal(chooseCourseSection(regions(-500,-150,46),"section-0",82), "section-1");
});
test("Course highlight hysteresis delays jitter at both boundaries",()=>{
 const top=82;
 assert.equal(chooseCourseSection(regions(-250,70,490),"overview",top), "overview",
   "keep previous heading until next crosses the inner threshold");
 assert.equal(chooseCourseSection(regions(-250,60,490),"overview",top), "section-0");
 assert.equal(chooseCourseSection(regions(-260,90,510),"section-0",top), "section-0");
 assert.equal(chooseCourseSection(regions(-260,105,510),"section-0",top), "section-0");
 assert.equal(chooseCourseSection(regions(-260,106,510),"section-0",top), "overview");
});
test("Course highlight survives large jumps and empty courses",()=>{
 assert.equal(chooseCourseSection([], "overview",82),null);
 assert.equal(chooseCourseSection(regions(-900,-750,-200),"overview",82),"section-1");
 assert.equal(chooseCourseSection(regions(150,470,900),"section-1",82),"overview");
});
