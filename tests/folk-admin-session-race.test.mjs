import test from "node:test";
import assert from "node:assert/strict";
import {initializeFolkAccount,folkSignIn,folkSignOut,resetFolkAccountForTests} from "../src/platform/folkside-auth.js";
import {checkCourseAdmin,saveCourseLabel,deleteCourseLabel} from "../src/platform/folk-course-admin.js";

const config={url:"https://aeuouzkiyddfjtjfdosp.supabase.co",publishableKey:"sb_publishable_1234567890xyz"};
const owner="11111111-1111-4111-8111-111111111111";
const row={kind:"course-title",key:"5/Marin-Dynamikk",label:"Marin dynamikk"};

async function signInOwner(){
 resetFolkAccountForTests();
 await initializeFolkAccount({configLoader:async()=>config,fetchImpl:async(url)=>{
   if(String(url).includes("/auth/v1/token?grant_type=password"))
     return {ok:true,json:async()=>({access_token:"a".repeat(50),refresh_token:"b".repeat(30),
       expires_in:3600,user:{id:owner,email:"owner@example.test"}})};
   return {ok:true,json:async()=>({})};
 }});
 await folkSignIn({email:"owner@example.test",password:"dummy-password"});
}
const mockResponse=value=>({ok:true,status:200,json:async()=>value});
test("late administrator lookup cannot restore rights after sign out",async()=>{
 await signInOwner();
 let reply;
 const waiting=checkCourseAdmin({configLoader:async()=>config,fetchImpl:async()=>
   await new Promise(resolve=>{reply=resolve})});
 for(let i=0;i<20&&!reply;i++)await Promise.resolve();
 assert.equal(typeof reply,"function");
 await folkSignOut();
 reply(mockResponse([{user_id:owner}]));
 assert.equal(await waiting,false);
 resetFolkAccountForTests();
});
test("write acknowledgments must match the edited label exactly",async()=>{
 await signInOwner();
 const calls=[];
 const fetchImpl=async(url,options)=>{
   calls.push({url,options});
   if(url.includes("folk_site_admins"))return mockResponse([{user_id:owner}]);
   return mockResponse([{...row,label:"not what was requested"}]);
 };
 await assert.rejects(saveCourseLabel(row,{configLoader:async()=>config,fetchImpl}),/not confirmed/);
 assert.equal(calls.length,2);
 resetFolkAccountForTests();
});
test("delete acknowledgments must match the requested key",async()=>{
 await signInOwner();
 const fetchImpl=async(url)=>{
   if(url.includes("folk_site_admins"))return mockResponse([{user_id:owner}]);
   return mockResponse([{kind:row.kind,key:"5/OtherCourse"}]);
 };
 await assert.rejects(deleteCourseLabel(row,{configLoader:async()=>config,fetchImpl}),/No matching/);
 resetFolkAccountForTests();
});
test("a delayed admin read cannot confirm a write after the account signs out",async()=>{
 await signInOwner();
 let reply;
 const calls=[];
 const pending=saveCourseLabel(row,{configLoader:async()=>config,fetchImpl:async(url)=>{
   calls.push(url);
   return new Promise(resolve=>{reply=resolve});
 }});
 for(let i=0;i<20&&!reply;i++)await Promise.resolve();
 assert.equal(typeof reply,"function");
 await folkSignOut();
 reply(mockResponse([{user_id:owner}]));
 await assert.rejects(pending,/Admin access denied/);
 assert.equal(calls.length,1);
 resetFolkAccountForTests();
});
