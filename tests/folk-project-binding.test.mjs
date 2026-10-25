import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateFolkAuthConfig} from "../src/platform/folkside-auth.js";

test("deployed FolkNet config points to the verified TorMT organization project",()=>{
 const config=JSON.parse(readFileSync(
   new URL("../data/folkside-auth.json",import.meta.url),"utf8"));
 assert.equal(config.url,"https://aeuouzkiyddfjtjfdosp.supabase.co");
 assert.match(config.publishableKey,/^sb_publishable_[A-Za-z0-9_-]{10,}$/);
 assert.equal(validateFolkAuthConfig(config)?.url,config.url);
 assert.equal(validateFolkAuthConfig({
   ...config,url:"https://glfuvfmppkjmarujjqwg.supabase.co"}),null);
});
test("runtime auth and Supabase CLI configuration agree on new project",()=>{
 const auth=readFileSync(new URL("../src/platform/folkside-auth.js",import.meta.url),"utf8");
 const cli=readFileSync(new URL("../supabase/config.toml",import.meta.url),"utf8");
 assert.match(auth,/aeuouzkiyddfjtjfdosp/);
 assert.match(cli,/aeuouzkiyddfjtjfdosp/);
 assert.doesNotMatch(auth,/glfuvfmppkjmarujjqwg/);
 assert.doesNotMatch(cli,/glfuvfmppkjmarujjqwg/);
});
