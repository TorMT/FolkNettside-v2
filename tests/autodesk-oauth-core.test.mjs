import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,webcrypto} from "node:crypto";
import {handleAutodeskHubRequest,sealJSON,openJSON,
  encodeCursor,decodeCursor,safeReturnTo} from "../supabase/functions/autodesk-hub/core.js";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const SITE="https://tormt.github.io/FolkNettside-v2/";
const base="https://example.supabase.co/functions/v1/autodesk-hub/";
const secret=randomBytes(32).toString("base64url");
const user="8f89c92f-2a5d-466b-aa4d-4ab1cf34ae12";
const user2="09c1b4fa-0ca3-44f4-bb24-f0b96d566aea";
const env={clientId:"unit-test-app",clientSecret:"test-only-secret",
 redirectUri:base+"callback",key:secret};
const jwt="eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl";
const request=(route,method="GET",{auth=true,origin=true,body}={})=>new Request(
 base+route,{method,headers:{
 ...(auth?{Authorization:"Bearer "+jwt}:{}),
 ...(origin?{Origin:"https://tormt.github.io"}:{}),
 ...(body?{"Content-Type":"application/json"}:{})
 },...(body?{body:JSON.stringify(body)}:{})});
function fixtures(){
 const pending=new Map(),connections=new Map(),operations=[];
 const store={
  async savePending(p){pending.set(p.stateHash,p)},
  async consumePending(hash){const v=pending.get(hash);pending.delete(hash);return v},
  async saveConnection(id,box){connections.set(id,box)},
  async hasConnection(id){return connections.has(id)},
  async deleteConnection(id){connections.delete(id)}
 };
 const api={env,store,
  verifyUser:async()=>({id:user}),
  exchange:async({code,verifier})=>{
   operations.push({code,verifier});
   return {access_token:"aps_access_not_to_browser",
    refresh_token:"aps_refresh_not_to_browser",expires_in:3600};
  },
  getAccessToken:async(id)=>connections.has(id)?"aps_access_not_to_browser":null,
  fetchCatalog:async(args)=>{
   operations.push(args);
   return {entries:[{id:"h",type:"hub",name:"Fusion hub"}],
     nextLink:"https://developer.api.autodesk.com/project/v1/hubs?page%5Bnumber%5D=2"};
  }
 };
 return {api,store,pending,connections,operations};
}
test("AES-GCM binds encrypted tokens to purpose/user and cursors are signed",async()=>{
 const sealed=await sealJSON({refresh:"private"},secret,"user:"+user);
 assert.doesNotMatch(sealed.ciphertext,/private/);
 assert.deepEqual(await openJSON(sealed,secret,"user:"+user),{refresh:"private"});
 await assert.rejects(openJSON(sealed,secret,"user:"+user2));
 const cursor=await encodeCursor({userId:user,pageUrl:"https://example.test"},secret);
 assert.deepEqual(await decodeCursor(cursor,secret),
   {userId:user,pageUrl:"https://example.test"});
 const [payload,signature]=cursor.split(".");
 const modified=(payload.startsWith("A")?"B":"A")+payload.slice(1)+"."+signature;
 await assert.rejects(decodeCursor(modified,secret));
});
test("return URL cannot be an open redirect or escape V2 preview",()=>{
 assert.equal(safeReturnTo(SITE),SITE);
 for(const bad of ["https://evil.example/","https://tormt.github.io/FolkNettside/",
   "https://tormt.github.io/FolkNettside-v2/?code=secret",
   "https://tormt.github.io/FolkNettside-v2/#//evil.example/"]){
  assert.throws(()=>safeReturnTo(bad),/return URL/);
 }
});
test("authentication and CORS separate visitors from Autodesk tokens",async()=>{
 const {api}=fixtures();
 const unauthorized=await handleAutodeskHubRequest(request("session","GET",{auth:false}),api);
 assert.equal(unauthorized.status,401);
 const forbidden=await handleAutodeskHubRequest(new Request(base+"session",{
  headers:{Origin:"https://evil.example",Authorization:"Bearer "+jwt}
 }),api);
 assert.equal(forbidden.status,403);
 const options=await handleAutodeskHubRequest(request("authorize","OPTIONS",{auth:false}),api);
 assert.equal(options.status,204);
 assert.equal(options.headers.get("Access-Control-Allow-Origin"),"https://tormt.github.io");
 const disconnected=await handleAutodeskHubRequest(request("session"),api);
 assert.deepEqual(await disconnected.json(),{connected:false,configured:true});
});
test("OAuth callback consumes state once, encrypts token and returns only allowlisted URL",async()=>{
 const {api,connections,operations}=fixtures();
 const response=await handleAutodeskHubRequest(request("authorize","POST",{
  body:{returnTo:SITE+"#/engineering/cad"}}),api);
 assert.equal(response.status,200);
 const {authorizationUrl}=await response.json(),u=new URL(authorizationUrl);
 assert.equal(u.hostname,"developer.api.autodesk.com");
 assert.equal(u.searchParams.get("scope"),"data:read");
 assert.equal(u.searchParams.get("code_challenge_method"),"S256");
 assert.ok(u.searchParams.has("code_challenge"));
 assert.ok(!authorizationUrl.includes(env.clientSecret));
 const state=u.searchParams.get("state");
 const callback=base+"callback?code=example-code&state="+encodeURIComponent(state);
 const done=await handleAutodeskHubRequest(new Request(callback),api);
 assert.equal(done.status,303);
 assert.equal(done.headers.get("location"),SITE+"#/engineering/cad");
 assert.equal(connections.size,1);
 assert.ok(!JSON.stringify([...connections.values()]).includes("aps_refresh_not_to_browser"));
 assert.equal(operations[0].code,"example-code");
 const twice=await handleAutodeskHubRequest(new Request(callback),api);
 assert.equal(twice.status,400);
 const session=await handleAutodeskHubRequest(request("session"),api);
 assert.equal((await session.json()).connected,true);
});
test("read-only catalog is account-bound, uses signed cursors and returns no tokens",async()=>{
 const {api,connections,operations}=fixtures();
 connections.set(user,{ciphertext:"encrypted"});
 const a=await handleAutodeskHubRequest(request("catalog?level=hubs"),api);
 assert.equal(a.status,200);
 const first=await a.json();
 assert.equal(first.entries[0].name,"Fusion hub");
 assert.ok(first.nextCursor);
 assert.ok(!JSON.stringify(first).includes("aps_access_not_to_browser"));
 const another=await handleAutodeskHubRequest(request("catalog?level=hubs&cursor="+
   encodeURIComponent(first.nextCursor)),api);
 assert.equal(another.status,200);
 assert.equal(operations.at(-1).pageUrl,
  "https://developer.api.autodesk.com/project/v1/hubs?page%5Bnumber%5D=2");
 const invalid=await handleAutodeskHubRequest(request(
   "catalog?level=projects&hubId=h&cursor="+encodeURIComponent(first.nextCursor)),api);
 assert.equal(invalid.status,400);
 const forged=await handleAutodeskHubRequest(request("catalog?level=hubs&cursor="+
   encodeURIComponent((first.nextCursor.startsWith("A")?"B":"A")+first.nextCursor.slice(1))),api);
 assert.equal(forged.status,400);
 const forbidden=await handleAutodeskHubRequest(request("catalog?level=contents&projectId=p"),api);
 assert.equal(forbidden.status,400);
 const removed=await handleAutodeskHubRequest(request("session","DELETE"),api);
 assert.equal(removed.status,200);
 assert.equal(connections.size,0);
});
test("unconfigured backend fails closed, never starts OAuth or reads hub",async()=>{
 const {api}=fixtures();api.env={...api.env,clientSecret:""};
 const state=await handleAutodeskHubRequest(request("session"),api);
 assert.deepEqual(await state.json(),{connected:false,configured:false});
 const initiate=await handleAutodeskHubRequest(request("authorize","POST",{
   body:{returnTo:SITE}}),api);
 assert.equal(initiate.status,503);
 const catalog=await handleAutodeskHubRequest(request("catalog?level=hubs"),api);
 assert.equal(catalog.status,503);
});

test("distinct Supabase account cannot borrow someone else's Autodesk connection",async()=>{
 const {api,connections}=fixtures();
 connections.set(user,{ciphertext:"opaque"});
 api.verifyUser=async()=>({id:user2});
 const session=await handleAutodeskHubRequest(request("session"),api);
 assert.deepEqual(await session.json(),{connected:false,configured:true});
 const catalog=await handleAutodeskHubRequest(request("catalog?level=hubs"),api);
 assert.equal(catalog.status,403);
 const start=await handleAutodeskHubRequest(request("authorize","POST",{
   body:{returnTo:SITE}}),api);
 assert.equal(start.status,200);
 const authorization=await start.json();
 assert.ok(authorization.authorizationUrl.includes("scope=data%3Aread"));
 assert.equal(connections.size,1);
 assert.ok(connections.has(user));
 assert.ok(!connections.has(user2));
});
