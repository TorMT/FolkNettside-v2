import test from "node:test";
import assert from "node:assert/strict";
import {
 validateFolkAuthConfig,initializeFolkAccount,getFolkAccountSnapshot,
 folkSignIn,folkSignUp,getFolkAccessToken,getFolkAccountUser,getFolkLinkedProviders,folkSignOut,
 resetFolkAccountForTests
} from "../src/platform/folkside-auth.js";
const url="https://glfuvfmppkjmarujjqwg.supabase.co";
const config={url,publishableKey:"sb_publishable_"+ "A".repeat(32)};
const user={id:"11111111-2222-3333-4444-555555555555",email:"test@example.org"};
const session={access_token:"eyJ"+"x".repeat(30),refresh_token:"ref_"+"x".repeat(30),expires_in:3600,user};
const reply=(data,status=200)=>({ok:status>=200&&status<300,status,
 json:async()=>data});
const withAuth=async impl=>{
 resetFolkAccountForTests();
 const state=await initializeFolkAccount({
   configLoader:async()=>config,fetchImpl:impl
 });
 assert.equal(state.status,"signed-out");
};
test("public folkside configuration is pinned; secrets and unsafe origins cannot masquerade",()=>{
 assert.equal(validateFolkAuthConfig(config).url,url);
 assert.equal(validateFolkAuthConfig({...config,url:"https://evil.example"}),null);
 assert.equal(validateFolkAuthConfig({...config,publishableKey:"secret_role"}),null);
 assert.equal(validateFolkAuthConfig({...config,url:url+"/danger"}),null);
});
test("sign-in uses project publishable key; password never persisted in snapshot",async()=>{
 let posted;
 await withAuth(async(address,options)=>{
   posted={address,options};
   return reply(session);
 });
 const status=await folkSignIn({email:user.email,password:"never-write-this-password"});
 assert.equal(status.status,"signed-in");
 assert.equal(status.user.email,user.email);
 assert.equal(status.hasSession,true);
 assert.equal(posted.address,url+"/auth/v1/token?grant_type=password");
 assert.equal(posted.options.headers.apikey,config.publishableKey);
 assert.deepEqual(JSON.parse(posted.options.body),{
   email:user.email,password:"never-write-this-password"
 });
 assert.equal(JSON.stringify(status).includes("never-write-this-password"),false);
 assert.equal(JSON.stringify(status).includes(session.refresh_token),false);
 assert.equal(await getFolkAccessToken(),session.access_token);
});
test("sign-up with email confirmation does not fake connected account",async()=>{
 await withAuth(async()=>reply({id:user.id,user}));
 const result=await folkSignUp({email:user.email,password:"correct-horse-battery"});
 assert.equal(result.status,"signed-out");
 assert.match(result.error,/Check your email/);
});
test("expired bearer refresh coalesces simultaneous calls and preserves user ID",async()=>{
 let calls=0;
 await withAuth(async(url)=>{
   if(url.includes("grant_type=password"))return reply({...session,expires_in:1});
   if(url.includes("grant_type=refresh_token")){
     calls++;
     return reply({...session,access_token:"refreshed-"+"a".repeat(28)});
   }
   if(url.endsWith("/user"))return reply(user);
   throw Error("Unexpected request");
 });
 await folkSignIn({email:user.email,password:"abcdefghij"});
 const tokens=await Promise.all(Array.from({length:5},()=>getFolkAccessToken()));
 assert.equal(calls,1);
 assert.equal(new Set(tokens).size,1);
 assert.deepEqual(await getFolkAccountUser(),user);
});
test("failed refresh clears account, while logout clears it before a remote reply",async()=>{
 let revoked=0;
 await withAuth(async(address)=>{
   if(address.includes("grant_type=password"))return reply({...session,expires_in:1});
   if(address.includes("grant_type=refresh_token"))
     return reply({message:"expired"},401);
   if(address.endsWith("/logout")){revoked++;return reply({})}
   throw Error("Unexpected endpoint");
 });
 await folkSignIn({email:user.email,password:"abcdefghij"});
 await assert.rejects(getFolkAccessToken(),/expired/);
 assert.equal(getFolkAccountSnapshot().status,"signed-out");
 await folkSignIn({email:user.email,password:"abcdefghij"});
 await folkSignOut();
 assert.equal(getFolkAccountSnapshot().status,"signed-out");
 assert.equal(revoked,1);
});
test("auth failures do not reveal server internals or invent identities",async()=>{
 await withAuth(async()=>reply({message:"Invalid login credentials"},400));
 await assert.rejects(folkSignIn({email:user.email,password:"abcdefghij"}),/Invalid login/);
 assert.equal(getFolkAccountSnapshot().user,null);
 await assert.rejects(folkSignIn({email:"bad",password:"abcdefghij"}),/valid email/);
});

test("linked Google login status uses verified FolkNet identities, never Drive tokens",async()=>{
 let userResponse={...user,identities:[
   {provider:"email",identity_id:"id-email",identity_data:{email:user.email}},
   {provider:"google",identity_id:"id-google",identity_data:{email:user.email,access_token:"do-not-echo"}},
   {provider:"google",identity_id:"duplicate"},
   {provider:"unknown-provider",identity_id:"other"}
 ]};
 await withAuth(async(address)=>{
   if(address.includes("grant_type=password"))return reply(session);
   if(address.endsWith("/user"))return reply(userResponse);
   throw Error("Unexpected auth request");
 });
 await folkSignIn({email:user.email,password:"abcdefghij"});
 const result=await getFolkLinkedProviders();
 assert.equal(result.available,true);
 assert.equal(result.googleLinked,true);
 assert.deepEqual(result.providers,["email","google"]);
 assert.equal(JSON.stringify(result).includes("do-not-echo"),false);
 userResponse={...user,identities:[{provider:"email",identity_id:"e"}]};
 const onlyEmail=await getFolkLinkedProviders();
 assert.equal(onlyEmail.googleLinked,false);
 userResponse={...user};
 const unknown=await getFolkLinkedProviders();
 assert.equal(unknown.available,false);
 userResponse={...user,id:"different-user",identities:[{provider:"google"}]};
 await assert.rejects(getFolkLinkedProviders(),/identity verification/);
});
