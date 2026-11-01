const GOOGLE_GIS_SRC="https://accounts.google.com/gsi/client";
const USERINFO_URL="https://openidconnect.googleapis.com/v1/userinfo";
const STATIC_CONFIG="./data/google-auth.json";
const DRIVE_SCOPE="https://www.googleapis.com/auth/drive.file";
const IDENTITY_SCOPES=["openid","email","profile"];

const listeners=new Set();
let tokenClient=null;
let configPromise=null;
let accessPromise=null;
let identityRefreshPromise=null;
let sessionRevision=0;
let rejectPendingToken=null;
let state={
  status:"signed-out",
  configured:null,
  config:null,
  profile:null,
  accessToken:"",
  accessTokenExpiresAt:0,
  error:""
};

function cloneState(){
  return {
    status:state.status,
    configured:state.configured,
    profile:state.profile?{...state.profile}:null,
    error:state.error,
    hasFreshToken:hasFreshToken()
  };
}

function emit(){
  const snapshot=cloneState();
  for(const listener of listeners){
    try{listener(snapshot)}catch{}
  }
  globalThis.dispatchEvent?.(new CustomEvent("folk-google-session",{detail:snapshot}));
}

function setState(patch){
  state={...state,...patch};
  emit();
}

function hasFreshToken(){
  return !!state.accessToken&&Date.now()<(state.accessTokenExpiresAt-60000);
}

function normalizedConfig(value){
  if(!value||typeof value!=="object")return null;
  const clientId=String(value.clientId||"").trim();
  if(!clientId)return null;
  // Only request the scopes V2 actually needs. A legacy backend or a
  // accidentally broadened config must never expand browser permissions.
  const scopes=new Set([...IDENTITY_SCOPES,DRIVE_SCOPE]);
  return {
    ...value,
    clientId,
    scope:[...scopes].join(" ")
  };
}

async function loadScriptOnce(src,ready){
  if(ready?.())return;
  const existing=document.querySelector(`script[data-folk-google-gis="${src}"]`);
  if(existing){
    await new Promise((resolve,reject)=>{
      if(ready?.())return resolve();
      existing.addEventListener("load",resolve,{once:true});
      existing.addEventListener("error",()=>reject(new Error("Google Identity Services could not be loaded.")),{once:true});
    });
    return;
  }
  await new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=src;
    script.async=true;
    script.dataset.folkGoogleGis=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error("Google Identity Services could not be loaded."));
    document.head.append(script);
  });
}

export async function loadGoogleSessionConfig({force=false}={}){
  if(state.config&&!force)return state.config;
  if(configPromise&&!force)return configPromise;
  configPromise=(async()=>{
    setState({status:state.profile?"signed-in":"loading",error:""});
    try{
      let raw=globalThis.__FOLK_GOOGLE_AUTH_CONFIG__||null;
      if(!raw){
        // A public browser OAuth client ID must belong to this V2 deployment.
        // Never auto-discover V1 /includes/ endpoints on NTNU staging: that
        // would silently couple accounts, scopes and origins across versions.
        for(const path of [STATIC_CONFIG]){
          try{
            const response=await fetch(path,{cache:"no-store",headers:{"Accept":"application/json"}});
            if(!response.ok)continue;
            const payload=await response.json();
            raw=payload?.googleDriveAuth||payload?.google||payload;
            if(raw?.clientId)break;
          }catch{ /* Optional configuration not present on this origin. */ }
        }
      }
      const config=normalizedConfig(raw);
      if(!config)throw new Error("Google sign-in is not configured on this deployment.");
      state.config=config;
      state.configured=true;
      setState({status:state.profile?"signed-in":"signed-out",configured:true,error:""});
      return config;
    }catch(error){
      state.config=null;
      state.configured=false;
      setState({status:state.profile?"signed-in":"unavailable",configured:false,error:String(error?.message||error)});
      return null;
    }finally{
      configPromise=null;
    }
  })();
  return configPromise;
}

async function ensureGoogleIdentity(){
  const config=state.config||await loadGoogleSessionConfig({force:state.configured===false});
  if(!config)throw new Error(state.error||"Google sign-in is unavailable.");
  await loadScriptOnce(GOOGLE_GIS_SRC,()=>!!globalThis.google?.accounts?.oauth2);
  if(!globalThis.google?.accounts?.oauth2)throw new Error("Google Identity Services is unavailable.");
  if(!tokenClient){
    tokenClient=globalThis.google.accounts.oauth2.initTokenClient({
      client_id:config.clientId,
      scope:config.scope,
      callback:()=>{}
    });
  }
  return config;
}

async function requestToken(prompt){
  const revision=sessionRevision;
  if(accessPromise)return accessPromise;
  const pending=(async()=>{
    await ensureGoogleIdentity();
    if(revision!==sessionRevision)throw new Error("Google authentication was cancelled.");
    return new Promise((resolve,reject)=>{
      let settled=false;
      const finish=(error,token)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timeout);
        if(rejectPendingToken===cancel)rejectPendingToken=null;
        if(error)reject(error);
        else resolve(token);
      };
      const cancel=()=>finish(new Error("Google authentication was cancelled."));
      rejectPendingToken=cancel;
      const timeout=setTimeout(()=>finish(new Error("Google authentication timed out. Try signing in again.")),90000);
      tokenClient.callback=response=>{
        if(revision!==sessionRevision){
          finish(new Error("Google account changed during authentication."));
          return;
        }
        if(response?.error){
          finish(new Error(response.error_description||response.error));
          return;
        }
        if(!response?.access_token){
          finish(new Error("Google returned no access token."));
          return;
        }
        // Stage issued credentials until Google userinfo verifies the subject.
        // No other caller may use an unverified token for Drive operations.
        finish(null,{
          accessToken:response.access_token,
          expiresAt:Date.now()+Math.max(1,Number(response.expires_in)||3600)*1000
        });
      };
      try{tokenClient.requestAccessToken({prompt})}
      catch(error){finish(error)}
    });
  })();
  accessPromise=pending;
  try{return await pending}
  finally{if(accessPromise===pending)accessPromise=null}
}

async function loadProfile(token){
  const response=await fetch(USERINFO_URL,{
    headers:{Authorization:`Bearer ${token}`},cache:"no-store",
    redirect:"error",signal:globalThis.AbortSignal?.timeout?.(10000)
  });
  if(!response.ok)throw Error("Google identity verification failed (HTTP "+response.status+").");
  const profile=await response.json();
  if(typeof profile?.sub!=="string"||!profile.sub.trim()||profile.sub.length>255)
    throw Error("Google did not return a verified account ID. Sign in again.");
  return {
    sub:profile.sub,
    name:String(profile.name||""),
    email:String(profile.email||""),
    picture:String(profile.picture||"")
  };
}

export async function connectGoogleSession(){
  const revision=sessionRevision;
  setState({status:"connecting",error:""});
  try{
    await loadGoogleSessionConfig({force:state.configured===false});
    const issued=await requestToken("consent");
    const profile=await loadProfile(issued.accessToken);
    if(revision!==sessionRevision)throw new Error("Google sign-in was cancelled.");
    setState({status:"signed-in",profile,error:"",configured:true,
      accessToken:issued.accessToken,accessTokenExpiresAt:issued.expiresAt});
    return cloneState();
  }catch(error){
    if(revision===sessionRevision)
      setState({status:"signed-out",profile:null,accessToken:"",accessTokenExpiresAt:0,error:String(error?.message||error)});
    throw error;
  }
}

export async function getGoogleAccessToken({interactive=false}={}){
  if(hasFreshToken())return state.accessToken;
  if(state.status!=="signed-in"){
    if(interactive){
      await connectGoogleSession();
      return state.accessToken;
    }
    const error=new Error("Sign in from Account & connections before using Google Drive.");
    error.code="AUTH_REQUIRED";
    throw error;
  }
  if(identityRefreshPromise)return identityRefreshPromise;
  const revision=sessionRevision;
  const originalSub=state.profile?.sub;
  const pending=(async()=>{
    try{
      const issued=await requestToken("");
      const verified=await loadProfile(issued.accessToken);
      if(revision!==sessionRevision)throw Error("Google session changed during refresh.");
      if(!originalSub||verified.sub!==originalSub)
        throw Error("Google account changed. Sign in again before using Drive.");
      setState({status:"signed-in",profile:verified,error:"",
        accessToken:issued.accessToken,accessTokenExpiresAt:issued.expiresAt});
      return issued.accessToken;
    }catch(error){
      if(revision===sessionRevision){
        // Do not keep an unverified or possibly switched Drive account alive.
        disconnectGoogleSession();
        setState({error:String(error?.message||error)});
      }
      throw error;
    }
  })();
  identityRefreshPromise=pending;
  try{return await pending}
  finally{if(identityRefreshPromise===pending)identityRefreshPromise=null}
}

export function disconnectGoogleSession(){
  sessionRevision++;
  rejectPendingToken?.();
  accessPromise=null;
  identityRefreshPromise=null;
  const token=state.accessToken;
  try{
    if(token&&globalThis.google?.accounts?.oauth2?.revoke)globalThis.google.accounts.oauth2.revoke(token,()=>{});
  }catch{}
  state.accessToken="";
  state.accessTokenExpiresAt=0;
  state.profile=null;
  setState({status:"signed-out",error:""});
}

export function getGoogleSessionSnapshot(){
  return cloneState();
}

export function isGoogleSignedIn(){
  return state.status==="signed-in";
}

export function subscribeGoogleSession(listener){
  if(typeof listener!=="function")return()=>{};
  listeners.add(listener);
  return()=>listeners.delete(listener);
}

export function initGoogleSession(){
  if(typeof window!=="undefined"){
    window.FolkGoogleSession={
      snapshot:getGoogleSessionSnapshot,
      isSignedIn:isGoogleSignedIn,
      getAccessToken:getGoogleAccessToken,
      connect:connectGoogleSession,
      disconnect:disconnectGoogleSession,
      subscribe:subscribeGoogleSession,
      loadConfig:loadGoogleSessionConfig
    };
    queueMicrotask(()=>loadGoogleSessionConfig().catch(()=>{}));
  }
  return getGoogleSessionSnapshot();
}
