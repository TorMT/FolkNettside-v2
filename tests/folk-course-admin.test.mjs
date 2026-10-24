import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  mergeCloudCourseLabels,loadPublicCourseLabels,checkCourseAdmin,saveCourseLabel
} from "../src/platform/folk-course-admin.js";
import {courseAdminTargets} from "../src/courses/admin-page.js";

const base={
  schemaVersion:1,courses:{"5/Marin-Dynamikk":{title:"Marin dynamikk"}},
  sections:{"5/Marin-Dynamikk/Øving3":"Øving 3"},folders:{},files:{}
};
test("cloud labels overlay presentation only, retaining original NTNU identifiers",()=>{
  const result=mergeCloudCourseLabels(base,[
    {kind:"course-title",key:"5/Marin-Dynamikk",label:"Ny tittel"},
    {kind:"section",key:"5/Marin-Dynamikk/Øving3",label:"Øving III"},
    {kind:"file",key:"5/Marin-Dynamikk/filer/Øving7.pdf",label:"Oppgave 7"}
  ]);
  assert.equal(result.courses["5/Marin-Dynamikk"].title,"Ny tittel");
  assert.equal(result.sections["5/Marin-Dynamikk/Øving3"],"Øving III");
  assert.equal(result.files["5/Marin-Dynamikk/filer/Øving7.pdf"],"Oppgave 7");
  assert.equal(base.courses["5/Marin-Dynamikk"].title,"Marin dynamikk");
});

test("reject malformed labels and unsafe paths without rendering",()=>{
  for(const row of [
    {kind:"admin",key:"5/Marin-Dynamikk",label:"X"},
    {kind:"course-title",key:"5/../private",label:"X"},
    {kind:"course-title",key:"5/Marin-Dynamikk",label:"<script>"},
    {kind:"file",key:"5/Marin-Dynamikk/filer/../../private",label:"X"}
  ])assert.throws(()=>mergeCloudCourseLabels(base,[row]),/Invalid|Unsafe/);
});

test("public Supabase labels require valid response and use only publishable key",async()=>{
  const calls=[];
  const config={url:"https://glfuvfmppkjmarujjqwg.supabase.co",
    publishableKey:"sb_publishable_1234567890xyz"};
  const result=await loadPublicCourseLabels({
    configLoader:async()=>config,
    fetchImpl:async(url,options)=>{
      calls.push({url,options});
      return {ok:true,status:200,json:async()=>[
        {kind:"course-title",key:"5/Marin-Dynamikk",label:"Marin"}
      ]};
    }
  });
  assert.equal(result.length,1);
  assert.match(calls[0].url,/\/rest\/v1\/folk_course_labels\?/);
  assert.equal(calls[0].options.headers.apikey,config.publishableKey);
  assert.equal(calls[0].options.headers.Authorization,undefined);
});

test("admin write APIs are denied before login, even with valid public labels",async()=>{
  assert.equal(await checkCourseAdmin(),false);
  await assert.rejects(saveCourseLabel({kind:"course-title",key:"5/Marin-Dynamikk",label:"HACK"}),/Admin access denied/);
});

test("admin editor only offers targets already in the validated course catalog",()=>{
  const targets=courseAdminTargets({
    semester:5,code:"Marin-Dynamikk",title:"Marin dynamikk",description:"NTNU",
    resources:[
      {section:"Øving 7",originalSection:"Øving 7",name:"Øving7.pdf",
       relativePath:"filer/Øving7.pdf",label:"Øving 7"}
    ]
  });
  assert.equal(targets[0].kind,"course-title");
  assert.equal(targets[1].kind,"course-description");
  assert.ok(targets.some(x=>x.kind==="section"&&x.key==="5/Marin-Dynamikk/Øving 7"));
  assert.ok(targets.some(x=>x.kind==="file"&&x.key==="5/Marin-Dynamikk/filer/Øving7.pdf"));
});

test("SQL candidate enforces row-level security and one administrator",()=>{
  const schema=readFileSync(new URL("../server/supabase/20261024_folk_course_labels_candidate.sql",import.meta.url),"utf8");
  assert.match(schema,/slot smallint not null default 1 unique check \(slot = 1\)/);
  assert.match(schema,/folk_site_admins enable row level security/);
  assert.match(schema,/folk_course_labels enable row level security/);
  assert.match(schema,/for insert to authenticated/);
  assert.match(schema,/for update to authenticated/);
  assert.match(schema,/for delete to authenticated/);
  assert.doesNotMatch(schema,/grant insert, update, delete on public.folk_course_labels to anon/);
  assert.match(schema,/when 'course-title' then 130/);
  assert.match(schema,/when 'course-description' then 300/);
  assert.match(schema,/else 160 end/);
});

test("Supabase admin deletion confirms exactly one removed row and request has a timeout",()=>{
  const code=readFileSync(new URL("../src/platform/folk-course-admin.js",import.meta.url),"utf8");
  const settings=readFileSync(new URL("../src/settings/settings-page.js",import.meta.url),"utf8");
  assert.match(code,/signal:globalThis.AbortSignal\?\.timeout\?\.\(10000\)/);
  assert.match(code,/redirect:"error"/);
  assert.match(code,/method:"DELETE",headers:\{Prefer:"return=representation"\}/);
  assert.match(code,/removed.length!==1/);
  assert.match(settings,/href="#\/admin\/courses"/);
});
