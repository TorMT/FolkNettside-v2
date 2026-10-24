import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {karakterwebUrl,optionalKarakterwebUrl} from "../src/courses/external-links.js";

test("Legacy NTNU folder slugs do not block navigation to courses",()=>{
  for(const slug of ["exphil","genkjemi","Marin-Dynamikk","marin-teknikk-4-propulsjon","teknologiledelse"]){
    assert.equal(optionalKarakterwebUrl(slug),null);
  }
  assert.equal(optionalKarakterwebUrl("TMR4182"),karakterwebUrl("TMR4182"));
});

test("Course page only renders Karakterweb for a valid code",()=>{
  const code=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(code,/const karakterwebHref=optionalKarakterwebUrl\(course\.code\)/);
  assert.match(code,/karakterwebHref\?'<button data-course-nav="karakterweb"/);
  assert.match(code,/karakterwebHref\?\x60<section class="resource-section" id="course-karakterweb"/);
  assert.match(code,/\.\.\.\(karakterwebHref\?\[\{element:app\.querySelector\("#course-karakterweb"\)/);
  assert.doesNotMatch(code,/const karakterwebHref=karakterwebUrl\(course\.code\)/);
});
