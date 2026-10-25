import test from "node:test";
import assert from "node:assert/strict";
import {
  validateHubConfig,normalizeHubEntry,parseCatalogResponse,
  catalogRequestURL,createAutodeskHubClient
} from "../src/platform/autodesk-hub-client.js";

const base="https://api.example.test/api/autodesk/";
test("only explicit HTTPS backend config enables Autodesk; no silent Google session reuse",()=>{
 assert.equal(validateHubConfig(null).enabled,false);
 assert.equal(validateHubConfig({}).enabled,false);
 const c=validateHubConfig({apiBase:"https://api.example.test/api/autodesk"});
 assert.equal(c.apiBase,base);
 assert.throws(()=>validateHubConfig({apiBase:"http://example.com/api"}),/HTTPS/);
 assert.throws(()=>validateHubConfig({apiBase:"https://a.example/api?token=secret"}),/credentials/);
 assert.throws(()=>validateHubConfig({apiBase:"https://u:p@a.example/api"}),/credentials/);
});
test("hub endpoints are exactly scoped and encode arbitrary Fusion URNs safely",()=>{
 const urn="urn:adsk.wipprod:dm.folder:123%?a/b";
 const u=new URL(catalogRequestURL(base,"contents",{projectId:"hub project",folderId:urn}));
 assert.equal(u.origin,"https://api.example.test");
 assert.equal(u.pathname,"/api/autodesk/catalog");
 assert.equal(u.searchParams.get("level"),"contents");
 assert.equal(u.searchParams.get("projectId"),"hub project");
 assert.equal(u.searchParams.get("folderId"),urn);
 assert.equal(new URL(catalogRequestURL(base,"hubs")).searchParams.get("level"),"hubs");
 assert.throws(()=>catalogRequestURL(base,"contents",{projectId:"x"}),/folderId/);
 assert.throws(()=>catalogRequestURL(base,"write",{}),/Unsupported/);
 assert.throws(()=>catalogRequestURL(base,"hubs",{},"\u0000"),/cursor/);
});
test("untrusted API output is validated, bounded and never exposes javascript web links",()=>{
 const safe=normalizeHubEntry({id:"a",type:"item",name:"CAD model",
  webUrl:"https://myhub.autodesk.com/projects/id"});
 assert.equal(safe.webUrl,"https://myhub.autodesk.com/projects/id");
 for(const url of ["javascript:alert(1)","https://evil.example/file","http://autodesk.com/unsafe"]){
   assert.equal(normalizeHubEntry({id:"a",type:"item",name:"file",webUrl:url}).webUrl,undefined);
 }
 assert.throws(()=>normalizeHubEntry({id:"x",type:"secret",name:"malicious"}),/Invalid/);
 assert.throws(()=>parseCatalogResponse({entries:Array(151).fill({id:"x",type:"item"})}),/oversized/);
 assert.throws(()=>parseCatalogResponse({entries:[],nextCursor:123}),/pagination/);
});
test("authenticated backend is called with credentials, never Autodesk access token in browser",async()=>{
 const log=[];
 const fake=async(url,opts)=>{
   log.push({url,opts});
   if(url.endsWith("/session"))return {
     ok:true,status:200,json:async()=>({connected:true,displayName:"Fusion Engineer"})};
   return {ok:true,status:200,json:async()=>({
      entries:[{id:"hub-1",type:"hub",name:"Fusion Team"}],nextCursor:"next"
   })};
 };
 const client=createAutodeskHubClient({apiBase:base},{fetchImpl:fake});
 const session=await client.session();
 assert.equal(session.connected,true);
 const catalog=await client.catalog("hubs");
 assert.equal(catalog.entries[0].name,"Fusion Team");
 assert.equal(catalog.nextCursor,"next");
 assert.ok(log.every(x=>x.opts.credentials==="include"&&x.opts.method==="GET"));
 assert.ok(log.every(x=>x.opts.headers.Authorization===undefined));
 assert.equal(log.length,2);
});
test("authorization failure stops browsing without leaking credentials",async()=>{
 const client=createAutodeskHubClient({apiBase:base},{fetchImpl:async()=>({
   status:401,ok:false,json:async()=>({reason:"expired"})
 })});
 await assert.rejects(client.catalog("hubs"),err=>err.status===401);
});

test("FolkNet mode locks bearer token to exact first-party Edge Function",()=>{
 const good="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/autodesk-hub/";
 const cfg=validateHubConfig({apiBase:good,authMode:"folknet"});
 assert.equal(cfg.authMode,"folknet");
 for(const candidate of ["https://evil.example/functions/v1/autodesk-hub/",
   "https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/evil/",
   "https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/autodesk-hub/login/"]){
   assert.throws(()=>validateHubConfig({apiBase:candidate,authMode:"folknet"}),
     /exact first-party/);
 }
});
test("Supabase bearer is only used for first-party session, catalog, OAuth initiation",async()=>{
 const base="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/autodesk-hub/";
 const logs=[],token="a".repeat(50);
 const client=createAutodeskHubClient({apiBase:base,authMode:"folknet"},{
   tokenProvider:async()=>token,
   fetchImpl:async(url,opts)=>{
     logs.push({url,opts});
     return {ok:true,status:200,json:async()=>{
       if(url.endsWith("/session"))return {connected:false,configured:true};
       if(url.endsWith("/authorize"))return {authorizationUrl:
         "https://developer.api.autodesk.com/authentication/v2/authorize?scope=data%3Aread"};
       return {entries:[],nextCursor:null};
     }};
   }
 });
 const status=await client.session();
 assert.equal(status.connected,false);
 await client.catalog("hubs");
 const target=await client.startAuthorization({
   returnTo:"https://tormt.github.io/FolkNettside-v2/#/engineering/cad"});
 assert.ok(target.startsWith("https://developer.api.autodesk.com/"));
 assert.equal(logs.length,3);
 assert.ok(logs.every(r=>r.opts.credentials==="omit"&&
   r.opts.headers.Authorization==="Bearer "+token));
 assert.equal(logs[2].opts.method,"POST");
 assert.equal(JSON.parse(logs[2].opts.body).returnTo,
   "https://tormt.github.io/FolkNettside-v2/#/engineering/cad");
 assert.ok(logs.every(r=>r.url.startsWith(base)));
});
test("OAuth backend redirects cannot point to malicious origins",async()=>{
 const base="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/autodesk-hub/";
 const client=createAutodeskHubClient({apiBase:base,authMode:"folknet"},{
   tokenProvider:async()=>"a".repeat(50),
   fetchImpl:async()=>({ok:true,status:200,json:async()=>({
     authorizationUrl:"https://evil.example/steal"
   })})
 });
 await assert.rejects(client.startAuthorization(),/authorization URL rejected/);
});

test("long HMAC pagination cursor is accepted but malformed payload is rejected",()=>{
 const opaque="a".repeat(2500)+"."+"b".repeat(43);
 const parsed=parseCatalogResponse({entries:[],nextCursor:opaque});
 assert.equal(parsed.nextCursor,opaque);
 const base="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/autodesk-hub/";
 const u=new URL(catalogRequestURL(base,"hubs",{},opaque));
 assert.equal(u.searchParams.get("cursor"),opaque);
 assert.throws(()=>parseCatalogResponse({entries:[],nextCursor:"javascript:alert(1)"}),
   /cursor/);
});
