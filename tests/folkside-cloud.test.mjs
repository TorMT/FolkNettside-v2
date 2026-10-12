import test from "node:test";
import assert from "node:assert/strict";
import {probeFolkCoreBackend} from "../src/platform/folkside-cloud.js";
import {settingsPageHTML} from "../src/settings/settings-page.js";
const config={url:"https://glfuvfmppkjmarujjqwg.supabase.co",
  publishableKey:"sb_publishable_"+"A".repeat(32)};
const userId="11111111-2222-3333-4444-555555555555";
const ok=body=>({ok:true,status:200,json:async()=>body});
const common={
  configLoader:async()=>config,
  tokenProvider:async()=>"faketoken",
  snapshotProvider:()=>({user:{id:userId}})
};
test("backend probe authenticates using Supabase token and checks exact user identity",async()=>{
 let request;
 const result=await probeFolkCoreBackend({...common,
   fetchImpl:async(url,options)=>{request={url,options};
     return ok({connected:true,userId,storageBucket:"folk-private",
       autodeskConnected:false})}
 });
 assert.equal(result.ok,true);
 assert.equal(result.privateStorageReady,true);
 assert.equal(result.autodeskConnected,false);
 assert.equal(request.url,config.url+"/functions/v1/folk-core/session");
 assert.equal(request.options.headers.Authorization,"Bearer faketoken");
 assert.equal(request.options.headers.apikey,config.publishableKey);
 assert.equal(request.options.method,"GET");
 assert.ok(!JSON.stringify(result).includes("faketoken"));
});
test("probe never accepts a different user ID or guessed storage bucket",async()=>{
 await assert.rejects(probeFolkCoreBackend({...common,
   fetchImpl:async()=>ok({connected:true,userId:"another-user",
     storageBucket:"folk-private"})}),/identity/);
 await assert.rejects(probeFolkCoreBackend({...common,
   fetchImpl:async()=>ok({connected:true,userId,
     storageBucket:"public"})}),/storage verification/);
 await assert.rejects(probeFolkCoreBackend({...common,
   fetchImpl:async()=>({ok:false,status:401,json:async()=>({})})
 }),/rejected/);
});
test("Google session and FolkNet session remain separate in account settings",()=>{
 const html=settingsPageHTML({settings:{},section:"connections",
   account:{status:"signed-in",profile:{email:"drive@example.org"}},
   folkAccount:{status:"signed-in",user:{email:"cloud@example.org"}}});
 assert.match(html,/Google \/ Drive/);
 assert.match(html,/drive@example.org/);
 assert.match(html,/FolkNet private cloud \/ Supabase/);
 assert.match(html,/cloud@example.org/);
 assert.match(html,/data-folk-signout/);
 assert.match(html,/data-folk-probe/);
 assert.doesNotMatch(html,/data-folk-signup/);
 const guest=settingsPageHTML({settings:{},section:"connections",
   account:{status:"signed-out"},folkAccount:{status:"signed-out"}});
 assert.match(guest,/data-folk-auth-form/);
 assert.match(guest,/data-folk-signup/);
 assert.doesNotMatch(guest,/data-folk-probe/);
});
test("untrusted session error message rendered as escaped text",()=>{
 const html=settingsPageHTML({settings:{},section:"connections",
   folkAccount:{status:"signed-out",error:'<script>alert(1)</script>'}});
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
});
