import test from "node:test";
import assert from "node:assert/strict";
import {settingsPageHTML} from "../src/settings/settings-page.js";

test("FolkNet account settings expose a read-only identity check to signed-in users",()=>{
 const signed=settingsPageHTML({section:"connections",
  folkAccount:{status:"signed-in",user:{id:"u",email:"safe@example.test"}},
  account:{status:"signed-out"}});
 assert.match(signed,/data-folk-identities/);
 assert.match(signed,/Check providers/);
 assert.match(signed,/not your Google Drive connection/);
 assert.match(signed,/data-folk-identities-result/);
 assert.doesNotMatch(signed,/data-folk-link-google/);
});

test("signed-out users never see account-provider inspection controls",()=>{
 const signedOut=settingsPageHTML({section:"connections",
   folkAccount:{status:"signed-out",user:null}});
 assert.doesNotMatch(signedOut,/data-folk-identities/);
});
