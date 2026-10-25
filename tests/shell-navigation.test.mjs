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
  assert.match(html,/data-go="\/settings\/connections"/);
});

test("shell account chip reflects the shared signed-in state",()=>{
  const html=renderTopShell("portfolio",{account:{status:"signed-in",profile:{name:"Test User"}}});
  assert.match(html,/account-chip signed-in/);
  assert.match(html,/Test User/);
});

test("header distinguishes FolkNet account from independent Google Drive session",()=>{
 const folk={status:"signed-in",user:{email:"cloud@example.org"}};
 const cloudOnly=renderTopShell("portfolio",{folkAccount:folk});
 assert.match(cloudOnly,/account-chip signed-in/);
 assert.match(cloudOnly,/cloud@example.org/);
 const dual=renderTopShell("engineering",{folkAccount:folk,
   account:{status:"signed-in",profile:{name:"Google Test"}}});
 assert.match(dual,/FolkNet \+ Drive/);
 const guest=renderTopShell("portfolio",{});
 assert.match(guest,/Sign in/);
 assert.doesNotMatch(guest,/account-chip signed-in/);
});

test("account chip escapes untrusted identity text in both initial and accessible label",()=>{
 const html=renderTopShell("portfolio",{
   folkAccount:{status:"signed-in",user:{email:'<img src=x onerror="alert(1)">' }}
 });
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/&lt;img/);
});

test("brand is a native keyboard-operable button and current route is announced",()=>{
  const courses=renderTopShell("courses",{coursesLabel:"Courses"});
  assert.match(courses,/<button type="button" class="brand" id="home" aria-label="Go to Projects">/);
  assert.doesNotMatch(courses,/<div class="brand" id="home">/);
  assert.match(courses,/data-go="\/courses" class="active" aria-current="page"/);
  assert.match(courses,/aria-label="Main navigation"/);
  assert.match(courses,/aria-label="Course navigation"/);
  const engineering=renderTopShell("engineering");
  assert.match(engineering,/data-go="\/engineering" class="active" aria-current="page"/);
  assert.match(engineering,/aria-controls="mobile-more-menu" aria-expanded="false"/);
  assert.match(engineering,/button type="button" data-search-open/);
});
