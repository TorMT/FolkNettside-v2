import test from "node:test";
import assert from "node:assert/strict";
import {
  safeAnalyticsCourse,safeAnalyticsPage,registerAnalyticsCourses,
  analyticsMeasurementId
} from "../src/platform/analytics.js";

const host="https://tormt.github.io/FolkNettside-v2/";
test("course analytics are manifest allowlisted and limited to public course IDs",()=>{
  registerAnalyticsCourses([
    {id:5,courses:[{code:"TMR4182"},{code:"TMR4330"}]},
    {id:6,courses:[{code:"TMA4245"}]},
    {id:7,courses:[{code:"../../profile.json"},{code:"S3CRET-IDENTITY"}]}
  ]);
  assert.deepEqual(safeAnalyticsCourse(host+"#/courses/5/TMR4182?student=PRIVATE"),{
    course_code:"TMR4182",course_semester:"5"
  });
  assert.deepEqual(safeAnalyticsCourse(host+"#/viewer/5/TMR4182/33?resource=secret"),{
    course_code:"TMR4182",course_semester:"5"
  });
  assert.deepEqual(safeAnalyticsCourse(host+"#/study/6/tma4245"),{
    course_code:"TMA4245",course_semester:"6"
  });
  for(const route of [
    "#/courses/5/TMR4183",
    "#/courses/5/TMA4245",
    "#/viewer/5/TMR4182/4/filename.pdf",
    "#/courses/5/%2e%2e",
    "#/courses/5/TMR4182/anything",
    "#/courses/5/TMR4182/4/unauthorized",
    "#/diverse/medisin"
  ])assert.equal(safeAnalyticsCourse(host+route),null,route);
});
test("no course codes can be inferred until trusted manifest is loaded",()=>{
  registerAnalyticsCourses([]);
  assert.equal(safeAnalyticsCourse(host+"#/viewer/5/TMR4182/0"),null);
});
test("landing page analytics use a stable Portfolio label",()=>{
  assert.equal(safeAnalyticsPage(host+"#/portfolio")?.route,"/portfolio");
  assert.equal(safeAnalyticsPage(host+"#/portfolio?utm=student-name")?.route,"/portfolio");
});
test("GA4 measurement identifier is a public property ID, not a credential",()=>{
  assert.equal(analyticsMeasurementId("G-BJ41MZJP0L"),"G-BJ41MZJP0L");
});
