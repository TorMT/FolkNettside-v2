import test from "node:test";
import assert from "node:assert/strict";
import {createFolkAppearanceBackup,validateCloudAppearance}
 from "../src/platform/folkside-preferences.js";
const config={url:"https://aeuouzkiyddfjtjfdosp.supabase.co",
 publishableKey:"sb_publishable_"+"Z".repeat(30)};
const id="11111111-2222-3333-4444-555555555555";
const settings={mode:"system",accent:"teal",density:"comfortable",
 motion:"reduced",contrast:"high"};
const inputs={
 config,tokenProvider:async()=>"supabase-user-bearer",
 snapshotProvider:()=>({user:{id}})
};
const reply=(data,status=200)=>({
 ok:status>=200&&status<300,status,json:async()=>data
});
test("appearance key whitelist prevents private/medicine payloads and unknown UI states",()=>{
 assert.deepEqual(validateCloudAppearance({...settings,medicine:"secret"}),settings);
 assert.throws(()=>validateCloudAppearance({...settings,mode:"javascript:alert(1)"}),/choice/);
 assert.throws(()=>validateCloudAppearance({mode:"light"}),/choice/);
});
test("missing cloud backup returns null under RLS-scoped GET",async()=>{
 let observed;
 const api=createFolkAppearanceBackup({...inputs,fetchImpl:async(url,options)=>{
   observed={url,options};return reply([]);
 }});
 assert.equal(await api.read(),null);
 const u=new URL(observed.url);
 assert.equal(u.pathname,"/rest/v1/folk_user_settings");
 assert.equal(u.searchParams.get("user_id"),"eq."+id);
 assert.equal(u.searchParams.get("setting_key"),"eq.appearance");
 assert.equal(observed.options.headers.Authorization,"Bearer supabase-user-bearer");
 assert.equal(observed.options.headers.apikey,config.publishableKey);
});
test("first private backup INSERT is user-owned; never uploads sensitive keys",async()=>{
 let request;
 const api=createFolkAppearanceBackup({...inputs,fetchImpl:async(url,options)=>{
   request={url,options};return reply([{revision:1}]);
 }});
 const result=await api.save({...settings,token:"do-not-store"});
 assert.equal(result.revision,1);
 assert.equal(request.options.method,"POST");
 const body=JSON.parse(request.options.body);
 assert.equal(body.user_id,id);
 assert.equal(body.setting_key,"appearance");
 assert.deepEqual(body.setting_value,settings);
 assert.equal(JSON.stringify(body).includes("do-not-store"),false);
});
test("revision conditional update refuses silent concurrent overwrite",async()=>{
 let mode="success",request;
 const api=createFolkAppearanceBackup({...inputs,fetchImpl:async(url,options)=>{
   request={url,options};
   return reply(mode==="success"?[{revision:4}]:[]);
 }});
 const r=await api.save(settings,{expectedRevision:3});
 assert.equal(r.revision,4);
 assert.equal(request.options.method,"PATCH");
 const u=new URL(request.url);
 assert.equal(u.searchParams.get("revision"),"eq.3");
 assert.equal(JSON.parse(request.options.body).revision,4);
 mode="conflict";
 await assert.rejects(api.save(settings,{expectedRevision:3}),/another device/);
});
test("cloud read enforces version and approved settings",async()=>{
 let row={revision:2,setting_value:settings,updated_at:"2026-10-12T15:00:00Z"};
 const api=createFolkAppearanceBackup({...inputs,fetchImpl:async()=>reply([row])});
 const current=await api.read();
 assert.equal(current.revision,2);
 assert.deepEqual(current.settings,settings);
 row={...row,revision:-1};
 await assert.rejects(api.read(),/revision/);
 row={...row,revision:2,setting_value:{...settings,accent:"unknown"}};
 await assert.rejects(api.read(),/choice/);
});
test("cannot write settings without signed-in owner or trusted config",async()=>{
 assert.throws(()=>createFolkAppearanceBackup({config:{
   ...config,url:"https://attacker.example"
 }}),/configuration/);
 const api=createFolkAppearanceBackup({...inputs,
   snapshotProvider:()=>({user:null}),fetchImpl:async()=>reply([])});
 await assert.rejects(api.read(),/Sign in/);
 await assert.rejects(api.save(settings),/Sign in/);
});
