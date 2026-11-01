import test from "node:test";
import assert from "node:assert/strict";

const base=new URL("../src/platform/google-session.js",import.meta.url);
async function fresh(tag){
  return import(base.href+"?isolation="+tag);
}
function patchGlobal(pairs){
  const original=new Map();
  for(const [key,value] of Object.entries(pairs)){
    original.set(key,{exists:Object.hasOwn(globalThis,key),value:globalThis[key]});
    globalThis[key]=value;
  }
  return ()=>{
    for(const [key,item] of original){
      if(item.exists)globalThis[key]=item.value;
      else delete globalThis[key];
    }
  };
}

test("NTNU V2 only reads its own public OAuth config and never V1 PHP",async()=>{
  const requests=[];
  const restore=patchGlobal({
    location:{hostname:"tormt.folk.ntnu.no",origin:"https://tormt.folk.ntnu.no"},
    fetch:async url=>{requests.push(String(url));return {ok:false,status:404}},
    __FOLK_GOOGLE_AUTH_CONFIG__:null
  });
  try{
    const session=await fresh("ntnu-not-v1");
    assert.equal(await session.loadGoogleSessionConfig(),null);
    assert.deepEqual(requests,["./data/google-auth.json"]);
    assert.equal(session.getGoogleSessionSnapshot().status,"unavailable");
  }finally{restore()}
});

test("Google browser scope is strictly only identity and drive.file",async()=>{
  const restore=patchGlobal({
    __FOLK_GOOGLE_AUTH_CONFIG__:{
      clientId:"1234-client.apps.googleusercontent.com",
      scope:"https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.modify"
    }
  });
  try{
    const session=await fresh("least-privilege");
    const cfg=await session.loadGoogleSessionConfig();
    assert.equal(cfg.clientId,"1234-client.apps.googleusercontent.com");
    assert.equal(cfg.scope,"openid email profile https://www.googleapis.com/auth/drive.file");
    assert.doesNotMatch(cfg.scope,/gmail.modify|auth\/drive(?:\s|$)/);
  }finally{restore()}
});

test("Disconnect cancels in-flight OAuth and discards late callbacks",async()=>{
  let client;
  const oauth2={
    initTokenClient:options=>{
      client={...options,requestAccessToken(){this.requests=(this.requests||0)+1}};
      return client;
    },
    revoke(){}
  };
  const restore=patchGlobal({
    google:{accounts:{oauth2}},
    __FOLK_GOOGLE_AUTH_CONFIG__:{clientId:"1234-client.apps.googleusercontent.com"}
  });
  try{
    const session=await fresh("logout-cancel");
    const signingIn=session.connectGoogleSession();
    for(let i=0;i<15&&!client?.requests;i++)await new Promise(r=>setTimeout(r,0));
    assert.equal(client?.requests,1,"oauth token request must be started");
    const previousCallback=client.callback;
    session.disconnectGoogleSession();
    await assert.rejects(signingIn,/cancel/i);
    previousCallback({access_token:"unexpected-late-token",expires_in:3600});
    assert.equal(session.getGoogleSessionSnapshot().status,"signed-out");
    assert.equal(session.getGoogleSessionSnapshot().hasFreshToken,false);
  }finally{restore()}
});

test("Normal Google sign-in still supports narrow Drive access, sign-out",async()=>{
  let client,revoked=false;
  const restore=patchGlobal({
    google:{accounts:{oauth2:{
      initTokenClient:options=>{
        client={...options,requestAccessToken(){this.requests=(this.requests||0)+1}};
        return client;
      },
      revoke:(token,cb)=>{revoked=token==="fixture-google-token";cb?.()}
    }}},
    __FOLK_GOOGLE_AUTH_CONFIG__:{clientId:"1234-client.apps.googleusercontent.com"},
    fetch:async url=>({
      ok:true,
      json:async()=>({sub:"test-sub-123",name:"Test user",email:"user@example.invalid"})
    })
  });
  try{
    const session=await fresh("normal-signin");
    const signingIn=session.connectGoogleSession();
    for(let i=0;i<15&&!client?.requests;i++)await new Promise(r=>setTimeout(r,0));
    assert.equal(client.requests,1);
    client.callback({access_token:"fixture-google-token",expires_in:3600});
    await signingIn;
    assert.equal(session.getGoogleSessionSnapshot().profile.sub,"test-sub-123");
    assert.equal(await session.getGoogleAccessToken(),"fixture-google-token");
    session.disconnectGoogleSession();
    assert.equal(revoked,true);
    assert.equal(session.getGoogleSessionSnapshot().status,"signed-out");
  }finally{restore()}
});

test("Google refresh requests a new token each time and verifies the same account",async()=>{
  let client,requestCount=0,profileCount=0;
  const restore=patchGlobal({
    google:{accounts:{oauth2:{
      initTokenClient:options=>{
        client={...options,requestAccessToken(){requestCount++}};
        return client;
      },
      revoke(){}
    }}},
    __FOLK_GOOGLE_AUTH_CONFIG__:{clientId:"1234-client.apps.googleusercontent.com"},
    fetch:async()=>{profileCount++;return {ok:true,json:async()=>({sub:"owner-sub",email:"owner@example.invalid"})}}
  });
  try{
    const session=await fresh("refresh-verified");
    const login=session.connectGoogleSession();
    for(let i=0;i<25&&!requestCount;i++)await new Promise(r=>setTimeout(r,0));
    assert.equal(requestCount,1);
    client.callback({access_token:"initial-token",expires_in:1});
    await login;
    assert.equal(session.getGoogleSessionSnapshot().hasFreshToken,false);
    const refreshA=session.getGoogleAccessToken();
    const refreshB=session.getGoogleAccessToken();
    for(let i=0;i<25&&requestCount<2;i++)await new Promise(r=>setTimeout(r,0));
    assert.equal(requestCount,2,"two concurrent refreshes must share the issued token");
    client.callback({access_token:"renewed-token",expires_in:1});
    assert.deepEqual(await Promise.all([refreshA,refreshB]),["renewed-token","renewed-token"]);
    const refreshC=session.getGoogleAccessToken();
    for(let i=0;i<25&&requestCount<3;i++)await new Promise(r=>setTimeout(r,0));
    assert.equal(requestCount,3,"resolved access promise must not pin the old token");
    client.callback({access_token:"second-renewal",expires_in:3600});
    assert.equal(await refreshC,"second-renewal");
    assert.equal(await session.getGoogleAccessToken(),"second-renewal");
    assert.equal(requestCount,3);
    assert.equal(profileCount,3,"every issued token must be identity-verified");
    assert.equal(session.getGoogleSessionSnapshot().profile.sub,"owner-sub");
  }finally{restore()}
});

test("Google connection refuses a missing subject instead of exposing an unidentified Drive account",async()=>{
  let client;
  const restore=patchGlobal({
    google:{accounts:{oauth2:{
      initTokenClient:options=>{
        client={...options,requestAccessToken(){this.started=true}};
        return client;
      },
      revoke(){}
    }}},
    __FOLK_GOOGLE_AUTH_CONFIG__:{clientId:"1234-client.apps.googleusercontent.com"},
    fetch:async()=>({ok:true,json:async()=>({email:"unverified@example.invalid"})})
  });
  try{
    const session=await fresh("missing-sub");
    const login=session.connectGoogleSession();
    for(let i=0;i<25&&!client?.started;i++)await new Promise(r=>setTimeout(r,0));
    client.callback({access_token:"unverified-token",expires_in:3600});
    await assert.rejects(login,/verified account ID/);
    assert.equal(session.getGoogleSessionSnapshot().status,"signed-out");
    assert.equal(session.getGoogleSessionSnapshot().hasFreshToken,false);
    assert.equal(session.getGoogleSessionSnapshot().profile,null);
  }finally{restore()}
});

test("refresh of a different Google subject rejects credentials and signs out",async()=>{
  let client,requests=0,subject="owner-sub";
  const restore=patchGlobal({
    google:{accounts:{oauth2:{
      initTokenClient:options=>{
        client={...options,requestAccessToken(){requests++}};
        return client;
      },
      revoke(){}
    }}},
    __FOLK_GOOGLE_AUTH_CONFIG__:{clientId:"1234-client.apps.googleusercontent.com"},
    fetch:async()=>({ok:true,json:async()=>({sub:subject})})
  });
  try{
    const session=await fresh("switched-sub");
    const login=session.connectGoogleSession();
    for(let i=0;i<25&&requests<1;i++)await new Promise(r=>setTimeout(r,0));
    client.callback({access_token:"owner-token",expires_in:1});
    await login;
    subject="other-account";
    const refresh=session.getGoogleAccessToken();
    for(let i=0;i<25&&requests<2;i++)await new Promise(r=>setTimeout(r,0));
    client.callback({access_token:"wrong-owner-token",expires_in:3600});
    await assert.rejects(refresh,/Google account changed/);
    assert.equal(session.getGoogleSessionSnapshot().status,"signed-out");
    assert.equal(session.getGoogleSessionSnapshot().hasFreshToken,false);
    await assert.rejects(session.getGoogleAccessToken(),/Sign in from Account/);
  }finally{restore()}
});
