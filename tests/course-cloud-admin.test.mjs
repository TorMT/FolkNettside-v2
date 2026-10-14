import test from "node:test";
import assert from "node:assert/strict";
import {
  loadCloudDisplayNames,isFolkCourseAdmin,saveCloudDisplayNames
} from "../src/courses/cloud-display-names.js";
import {initializeFolkAccount,folkSignIn,resetFolkAccountForTests}
  from "../src/platform/folkside-auth.js";
import {safeOriginalFileURL} from "../src/viewers/utils.js";

const url="https://glfuvfmppkjmarujjqwg.supabase.co";
const config={url,publishableKey:"sb_publishable_"+"A".repeat(32)};
const user={id:"11111111-2222-3333-4444-555555555555",email:"admin@example.org"};
const session={access_token:"access-"+"x".repeat(32),
  refresh_token:"refresh-"+"y".repeat(32),expires_in:3600,user};
const aliases={schemaVersion:1,courses:{"5/Marin-Dynamikk":{title:"Ny tittel"}},
  sections:{},folders:{},files:{}};
const reply=(data,status=200)=>({ok:status>=200&&status<300,status,
  json:async()=>data});

test("public aliases are loaded without account or secret, preserving schema",async()=>{
 let observed;
 const names=await loadCloudDisplayNames({
   configLoader:async()=>config,
   fetchImpl:async(address,options)=>{
     observed={address,options};
     return reply([{aliases}]);
   }
 });
 assert.equal(names.courses["5/Marin-Dynamikk"].title,"Ny tittel");
 assert.equal(observed.address,url+"/rest/v1/course_display_config?id=eq.main&select=aliases");
 assert.equal(observed.options.headers.Authorization,undefined);
 assert.equal(await loadCloudDisplayNames({
   configLoader:async()=>config,fetchImpl:async()=>reply([])
 }),null);
 await assert.rejects(loadCloudDisplayNames({
   configLoader:async()=>config,
   fetchImpl:async()=>reply([{aliases:{...aliases,files:{"1/exphil/filer/x.pdf":"<img>"}}}])
 }),/Invalid NTNU display name/);
});

test("admin membership checked server-side; authorized edits use bearer and validated document",async()=>{
 resetFolkAccountForTests();
 const authFetch=async(address)=>{
   if(address.includes("grant_type=password"))return reply(session);
   if(address.endsWith("/auth/v1/user"))return reply(user);
   throw Error("Unexpected auth URL: "+address);
 };
 await initializeFolkAccount({configLoader:async()=>config,fetchImpl:authFetch});
 await folkSignIn({email:user.email,password:"test-secret-123"});
 let published=null;
 const apiFetch=async(address,options)=>{
   if(address.includes("/folk_admins?")){
     assert.equal(options.headers.Authorization,"Bearer "+session.access_token);
     return reply([{user_id:user.id}]);
   }
   if(address.endsWith("/course_display_config?on_conflict=id")){
     assert.equal(options.method,"POST");
     assert.equal(options.headers.Authorization,"Bearer "+session.access_token);
     published=JSON.parse(options.body);
     return reply([{id:"main",aliases:published.aliases}]);
   }
   throw Error("Unexpected API call: "+address);
 };
 assert.equal(await isFolkCourseAdmin({configLoader:async()=>config,fetchImpl:apiFetch}),true);
 const result=await saveCloudDisplayNames(aliases,{configLoader:async()=>config,fetchImpl:apiFetch});
 assert.equal(published.id,"main");
 assert.equal(result.courses["5/Marin-Dynamikk"].title,"Ny tittel");
 await assert.rejects(saveCloudDisplayNames({...aliases,
   files:{"1/exphil/filer/a.pdf":"<script>"}
 },{configLoader:async()=>config,fetchImpl:apiFetch}),/Invalid NTNU/);
 resetFolkAccountForTests();
});

test("membership denial and database rejection never claim successful publishing",async()=>{
 resetFolkAccountForTests();
 await initializeFolkAccount({
   configLoader:async()=>config,
   fetchImpl:async(address)=>address.includes("grant_type=password")?
     reply(session):reply(user)
 });
 await folkSignIn({email:user.email,password:"test-secret-123"});
 assert.equal(await isFolkCourseAdmin({
   configLoader:async()=>config,fetchImpl:async()=>reply([])
 }),false);
 await assert.rejects(saveCloudDisplayNames(aliases,{
   configLoader:async()=>config,
   fetchImpl:async()=>reply({message:"Row level security denied"},403)
 }),/Row level security denied/);
 resetFolkAccountForTests();
});

test("only safe URLs, especially the expected NTNU remote archive, can be opened",()=>{
 assert.equal(safeOriginalFileURL({path:"javascript:alert(1)"}),null);
 assert.equal(safeOriginalFileURL({path:"data:text/html,hello"}),null);
 assert.equal(safeOriginalFileURL({remoteArchive:true,
   url:"https://other.example/semestre/5/x.pdf"}),null);
 assert.equal(safeOriginalFileURL({remoteArchive:true,
   url:"https://tormt.folk.ntnu.no/private/x.pdf"}),null);
 assert.equal(safeOriginalFileURL({remoteArchive:true,
   url:"https://tormt.folk.ntnu.no/semestre/5/a.pdf"}),
   "https://tormt.folk.ntnu.no/semestre/5/a.pdf");
});
