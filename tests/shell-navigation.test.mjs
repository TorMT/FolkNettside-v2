import test from "node:test";
import assert from "node:assert/strict";
import {MOBILE_NAV,PRIMARY_NAV,renderTopShell} from "../src/shell/navigation.js";

test("desktop and mobile nav share canonical routes",()=>{
  const primaryRoutes=new Set(PRIMARY_NAV.map(item=>item.route));
  for(const item of MOBILE_NAV.filter(item=>item.route)){
    assert.ok(primaryRoutes.has(item.route)||item.route==="/courses");
  }
});

test("mobile search stays an action rather than a duplicate route",()=>{
  const search=MOBILE_NAV.find(item=>item.id==="search");
  assert.equal(search.action,"search");
  assert.equal(search.route,undefined);
});

test("rendered shell exposes the same active navigation state",()=>{
  const html=renderTopShell("engineering",{coursesLabel:"Courses"});
  assert.match(html,/data-go="\/engineering" class="active"/);
  assert.match(html,/class="mobile-nav"/);
  assert.match(html,/data-search-open/);
});
