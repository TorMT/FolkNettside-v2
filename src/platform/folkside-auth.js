/**
 * Optional FolkNet account via Supabase Auth. This does NOT replace Google
 * Drive's existing OAuth token. The public publishable key has no privileges
 * on its own: all personal data remains protected by database/storage RLS.
 *
 * Session tokens are stored only in sessionStorage for this browser tab.
 * The site does not store passwords, expose a service-role key, or interpret
 * a Google access token as a Supabase Auth identity.
 */
const CONFIG_URL="./data/folkside-auth.json";
const SESSION_KEY="folk:v2:supabase:session";
const listeners=new Set();
const copyUser=user=>user?{id:String(user.id||""),email:String(user.email||"")}:null;
let state={status:"loading",configured:null,user:null,error:""};
let auth=null,initPromise=null,refreshPromise=null,revision=0;

function publish(){
 const snapshot=getFolkAccountSnapshot();
 for(const fn of listeners)try{fn(snapshot)}catch{}
 if(typeof window!=="undefined")window.dispatchEvent(
   new CustomEvent("folk:account",{detail:snapshot}));
}
function patch(next){state={...state,...next};publish()}
function store(){
 try{return globalThis.sessionStorage||null}catch{return null}
}
function fromStorage(){
 try{
   const raw=store()?.getItem(SESSION_KEY);
   if(!raw)return null;
   const x=JSON.parse(raw);
   return validSession(x)?x:null;
 }catch{return null}
}
function saveSession(session){
 try{
   if(session)store()?.setItem(SESSION_KEY,JSON.stringify(session));
   else store()?.removeItem(SESSION_KEY);
 }catch{/* Memory-only fallback if storage is disabled. */}
}
function validSession(session){
 return session&&typeof session.access_token==="string"&&
   session.access_token.length>=20&&
   typeof session.refresh_token==="string"&&session.refresh_token.length>=10&&
   Number.isFinite(session.expires_at)&&session.expires_at>0;
}
function normalizeConfig(value){
 if(!value||typeof value!=="object")return null;
 try{
   const url=new URL(String(value.url||""));
   if(url.origin!=="https://glfuvfmppkjmarujjqwg.supabase.co"||
     url.pathname!=="/"||url.search||url.hash)return null;
   const key=String(value.publishableKey||"");
   if(!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key))return null;
   return {url:url.origin,publishableKey:key};
 }catch{return null}
}
export function validateFolkAuthConfig(value){return normalizeConfig(value)}
const emailValid=email=>typeof email==="string"&&
 /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())&&email.length<=254;
function normalizeAuthSession(response,prior=null){
 if(!response||typeof response!=="object"||
   typeof response.access_token!=="string"||
   typeof response.refresh_token!=="string"||
   !Number.isFinite(response.expires_in)||response.expires_in<=0||
   !response.user?.id)
   throw Error("Supabase returned no usable session; verify your email before signing in.");
 return {
   access_token:response.access_token,
   refresh_token:response.refresh_token,
   expires_at:Math.floor(Date.now()/1000)+response.expires_in,
   user:copyUser(response.user)
 };
}
function clearLocal(){
 auth&& (auth.session=null);
 saveSession(null);
 patch({status:auth?"signed-out":"unavailable",user:null,error:""});
}
function requestPath(path,{method="GET",body,token,signal}={}){
 if(!auth)throw Error("FolkNet account is not configured.");
 return {url:auth.config.url+"/auth/v1/"+path,
   options:{
     method,cache:"no-store",signal,
     headers:{"apikey":auth.config.publishableKey,
       "Accept":"application/json",
       ...(body?{"Content-Type":"application/json"}:{}),
       ...(token?{"Authorization":"Bearer "+token}:{})},
     ...(body?{body:JSON.stringify(body)}:{})
   }};
}
async function request(path,args={}){
 const {url,options}=requestPath(path,args);
 const response=await auth.fetchImpl(url,options);
 const result=await response.json().catch(()=>null);
 if(!response.ok){
   const error=new Error(
     response.status===429?"Too many requests. Try again later.":
     String(result?.msg||result?.error_description||result?.message||
       result?.error||"Supabase authentication failed").slice(0,240));
   error.status=response.status;
   throw error;
 }
 return result;
}
function setSession(session){
 if(!validSession(session))throw Error("Invalid Supabase session");
 auth.session=session;saveSession(session);
 patch({status:"signed-in",user:copyUser(session.user),error:""});
}
function rememberError(e){patch({error:String(e?.message||e).slice(0,240)})}
export function getFolkAccountSnapshot(){
 return {...state,user:copyUser(state.user),hasSession:state.status==="signed-in"};
}
export function subscribeFolkAccount(listener){
 if(typeof listener!=="function")return()=>{};
 listeners.add(listener);return()=>listeners.delete(listener);
}
export async function initializeFolkAccount({configLoader=null,fetchImpl=fetch}={}){
 if(initPromise)return initPromise;
 initPromise=(async()=>{
   try{
     const raw=configLoader?await configLoader():
       await fetchImpl(CONFIG_URL,{cache:"no-store",headers:{Accept:"application/json"}})
         .then(r=>r.ok?r.json():null);
     const config=normalizeConfig(raw);
     if(!config)throw Error("FolkNet account configuration unavailable.");
     auth={config,fetchImpl,session:fromStorage()};
     patch({configured:true,status:auth.session?"connecting":"signed-out",
       error:"",user:null});
     if(auth.session){
       try{await getFolkAccessToken({forceRefresh:true})}
       catch(e){clearLocal();rememberError(e)}
     }
     return getFolkAccountSnapshot();
   }catch(e){
     auth=null;patch({status:"unavailable",configured:false,error:String(e.message||e)});
     return getFolkAccountSnapshot();
   }
 })();
 return initPromise;
}
export async function folkSignIn({email,password}={}){
 if(!auth)await initializeFolkAccount();
 if(!auth)throw Error("FolkNet account is unavailable");
 if(!emailValid(email)||typeof password!=="string"||password.length<6)
   throw Error("Enter a valid email and password.");
 const myRevision=revision;patch({status:"connecting",error:""});
 try{
   const result=await request("token?grant_type=password",{
     method:"POST",body:{email:email.trim(),password}});
   if(myRevision!==revision)throw Error("Sign-in cancelled");
   setSession(normalizeAuthSession(result));
   return getFolkAccountSnapshot();
 }catch(error){
   if(myRevision===revision)patch({status:"signed-out",error:error.message,user:null});
   throw error;
 }
}
export async function folkSignUp({email,password}={}){
 if(!auth)await initializeFolkAccount();
 if(!auth)throw Error("FolkNet account is unavailable");
 if(!emailValid(email)||typeof password!=="string"||password.length<10)
   throw Error("Use a valid email and a password of at least 10 characters.");
 try{
   const result=await request("signup",{method:"POST",body:{
     email:email.trim(),password}});
   // Supabase usually requires email verification before sign in.
   if(result?.access_token&&result?.refresh_token&&result?.user?.id)
     setSession(normalizeAuthSession(result));
   else patch({status:"signed-out",user:null,error:"Check your email for the confirmation link, then sign in."});
   return getFolkAccountSnapshot();
 }catch(error){rememberError(error);throw error}
}
export async function getFolkAccessToken({forceRefresh=false}={}){
 if(!auth?.session)throw Error("Sign in to your FolkNet account first.");
 const session=auth.session;
 if(!forceRefresh&&Date.now()/1000<session.expires_at-90)
   return session.access_token;
 if(refreshPromise)return refreshPromise;
 const myRevision=revision;
 refreshPromise=(async()=>{
   try{
     const result=await request("token?grant_type=refresh_token",{
       method:"POST",body:{refresh_token:session.refresh_token}});
     if(myRevision!==revision)throw Error("Session changed during refresh");
     const updated=normalizeAuthSession(result,session);
     setSession(updated);
     return updated.access_token;
   }catch(error){
     if(myRevision===revision){
       // Never keep an expired or possibly revoked bearer session.
       clearLocal();rememberError(error);
     }
     throw error;
   }
 })();
 try{return await refreshPromise}finally{refreshPromise=null}
}
export async function getFolkAccountUser(){
 const token=await getFolkAccessToken();
 const result=await request("user",{token});
 if(!result?.id||result.id!==auth.session?.user?.id)
   throw Error("Account identity verification failed.");
 return copyUser(result);
}
export async function folkSignOut(){
 revision++;
 const token=auth?.session?.access_token;
 // Clear locally first regardless of network availability.
 clearLocal();
 if(!token)return;
 try{await request("logout",{method:"POST",token})}catch{}
}
export function resetFolkAccountForTests(){
 revision++;auth=null;initPromise=null;refreshPromise=null;
 saveSession(null);
 state={status:"loading",configured:null,user:null,error:""};
 listeners.clear();
}
