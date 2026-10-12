/**
 * Autodesk OAuth authorization-code + PKCE service, no browser-held APS tokens.
 * Store is a server-only adapter. All protected routes verify Supabase Auth.
 * No writes to Autodesk resources: only data:read is requested.
 */
const APS="https://developer.api.autodesk.com/authentication/v2";
const SITE="https://tormt.github.io/FolkNettside-v2/";
const ORIGIN="https://tormt.github.io";
const decoder=new TextDecoder(),encoder=new TextEncoder();
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const bytes=h=>{
 if(typeof h!=="string"||h.length%2||!/^[0-9a-f]*$/i.test(h))throw Error("Invalid ciphertext");
 return Uint8Array.from(h.match(/../g)||[],x=>parseInt(x,16));
};
const b64url=raw=>btoa(String.fromCharCode(...raw)).replace(/\+/g,"-")
 .replace(/\//g,"_").replace(/=+$/,"");
const fromB64=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const sha=async s=>new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s)));
const maxText=(s,n)=>typeof s==="string"&&s.length<=n&&s.length>0;
export const userIdValid=s=>typeof s==="string"&&
 /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
export function safeReturnTo(candidate){
 const u=new URL(String(candidate||SITE));
 if(u.origin!==ORIGIN||u.pathname!=="/FolkNettside-v2/"||
    u.username||u.password||u.search||u.hash.length>220||
    (u.hash&&!/^#\/[a-z0-9/_-]*$/i.test(u.hash)))
   throw Error("Unsupported Autodesk return URL");
 return u.toString();
}
export async function sha256Hex(s){return hex(await sha(s))}
export function decodeKey(secret){
 if(!maxText(secret,100))throw Error("Missing Autodesk encryption key");
 const raw=fromB64(secret);
 if(raw.length!==32)throw Error("Autodesk encryption key must be 32 bytes");
 return raw;
}
async function aesKey(secret){
 return crypto.subtle.importKey("raw",decodeKey(secret),{name:"AES-GCM"},false,
 ["encrypt","decrypt"]);
}
export async function sealJSON(value,secret,aad){
 const nonce=random(12),plain=encoder.encode(JSON.stringify(value));
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce,
   additionalData:encoder.encode(aad)},await aesKey(secret),plain);
 return {ciphertext:hex(new Uint8Array(cipher)),nonce:hex(nonce)};
}
export async function openJSON(box,secret,aad){
 const cipher=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(box.nonce),
   additionalData:encoder.encode(aad)},await aesKey(secret),bytes(box.ciphertext));
 return JSON.parse(decoder.decode(cipher));
}
async function cursorKey(secret){
 const raw=await sha("folk-autodesk-cursor-v1:"+hex(decodeKey(secret)));
 return crypto.subtle.importKey("raw",raw,{name:"HMAC",hash:"SHA-256"},
   false,["sign","verify"]);
}
export async function encodeCursor(data,secret){
 const msg=encoder.encode(JSON.stringify(data));
 const sig=await crypto.subtle.sign("HMAC",await cursorKey(secret),msg);
 return b64url(msg)+"."+b64url(new Uint8Array(sig));
}
export async function decodeCursor(cursor,secret){
 if(!maxText(cursor,2500)||!/^[-_a-zA-Z0-9]+\.[-_a-zA-Z0-9]+$/.test(cursor))
   throw Error("Invalid catalog cursor");
 const [m,s]=cursor.split("."),msg=fromB64(m);
 if(msg.length>1600||!await crypto.subtle.verify("HMAC",await cursorKey(secret),
     fromB64(s),msg))throw Error("Invalid catalog cursor signature");
 return JSON.parse(decoder.decode(msg));
}
export function apsAuthorizationURL({clientId,redirectUri,state,challenge}){
 if(!maxText(clientId,150)||!maxText(redirectUri,500)||
    !maxText(state,100)||!maxText(challenge,100))throw Error("Incomplete APS OAuth");
 const u=new URL(APS+"/authorize");
 for(const [name,value] of Object.entries({
   response_type:"code",client_id:clientId,redirect_uri:redirectUri,
   scope:"data:read",state,code_challenge:challenge,code_challenge_method:"S256"
 }))u.searchParams.set(name,value);
 return u.toString();
}
const json=(status,body,origin)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 ...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})}
});
const fail=(status,message,origin)=>json(status,{error:message},origin);
const isBearer=s=>typeof s==="string"&&/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s)&&s.length<8192;
const redirectTo=url=>new Response(null,{status:303,headers:{
 Location:safeReturnTo(url),"Cache-Control":"no-store",
 "Referrer-Policy":"no-referrer"
}});
const catalogFields={hubs:[],projects:["hubId"],
 topFolders:["hubId","projectId"],contents:["projectId","folderId"],
 versions:["projectId","itemId"]};
const validIdentifier=s=>maxText(s,600)&&!/[\u0000-\u001f\u007f]/.test(s);
/** Dependency adapter: verifyUser, storage, exchange, refresh, fetchCatalog. */
export async function handleAutodeskHubRequest(request,api){
 const origin=request.headers.get("Origin");
 if(origin&&origin!==ORIGIN)return fail(403,"Origin not permitted",null);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
 "Access-Control-Allow-Origin":ORIGIN,"Vary":"Origin",
 "Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS",
 "Access-Control-Allow-Headers":"authorization, apikey, content-type",
 "Access-Control-Max-Age":"600","Cache-Control":"no-store"
 }});
 const {env,store}=api,url=new URL(request.url);
 const route=url.pathname.split("/").filter(Boolean).at(-1);
 const oauthReady=Boolean(env.clientId&&env.clientSecret&&env.redirectUri&&env.key);
 // Callback carries one-time state, not a browser bearer token.
 if(route==="callback"&&request.method==="GET"){
   if(!oauthReady)return fail(503,"Autodesk is not configured",null);
   const state=url.searchParams.get("state"),code=url.searchParams.get("code");
   if(!maxText(state,200)||!maxText(code,2048))return fail(400,"Invalid OAuth callback",null);
   try{
     const hash=await sha256Hex(state);
     const pending=await store.consumePending(hash); // atomic DELETE RETURNING
     if(!pending||new Date(pending.expiresAt).getTime()<Date.now()||
        !userIdValid(pending.userId))return fail(400,"Expired or used OAuth state",null);
     const {verifier}=await openJSON(pending,env.key,"state:"+hash);
     const tokens=await api.exchange({code,verifier});
     if(!maxText(tokens.access_token,8192)||!maxText(tokens.refresh_token,8192)||
        !Number.isFinite(tokens.expires_in)||tokens.expires_in<=0)
       throw Error("Incomplete APS token response");
     const record={accessToken:tokens.access_token,
       refreshToken:tokens.refresh_token,
       expiresAt:Date.now()+tokens.expires_in*1000};
     await store.saveConnection(pending.userId,
       await sealJSON(record,env.key,"user:"+pending.userId));
     return redirectTo(pending.returnTo);
   }catch{return fail(502,"Autodesk authorization could not be completed",null)}
 }
 if(!["session","catalog","authorize"].includes(route))
   return fail(404,"Unknown Autodesk endpoint",origin);
 const bearer=request.headers.get("Authorization");
 if(!isBearer(bearer))return fail(401,"FolkNet sign-in required",origin);
 let user;
 try{user=await api.verifyUser(bearer.slice(7))}
 catch{return fail(503,"Account verification unavailable",origin)}
 if(!userIdValid(user?.id))return fail(401,"Invalid account session",origin);
 if(route==="session"&&request.method==="GET"){
   if(!oauthReady)return json(200,{connected:false,configured:false},origin);
   return json(200,{connected:await store.hasConnection(user.id),
     configured:true},origin);
 }
 if(!oauthReady)return fail(503,"Autodesk backend not configured",origin);
 if(route==="authorize"&&request.method==="POST"){
   let input;try{input=await request.json()}catch{return fail(400,"Invalid body",origin)}
   let returnTo;
   try{returnTo=safeReturnTo(input?.returnTo)}catch{return fail(400,"Invalid return URL",origin)}
   const verifier=b64url(random(48)),state=b64url(random(32));
   const challenge=b64url(await sha(verifier)),hash=await sha256Hex(state);
   await store.savePending({stateHash:hash,userId:user.id,returnTo,
     expiresAt:new Date(Date.now()+10*60*1000).toISOString(),
     ...await sealJSON({verifier},env.key,"state:"+hash)});
   return json(200,{authorizationUrl:apsAuthorizationURL({
     clientId:env.clientId,redirectUri:env.redirectUri,state,challenge
   })},origin);
 }
 if(route==="session"&&request.method==="DELETE"){
   await store.deleteConnection(user.id);
   return json(200,{connected:false},origin);
 }
 if(route==="catalog"&&request.method==="GET"){
   const level=url.searchParams.get("level");
   if(!Object.hasOwn(catalogFields,level))return fail(400,"Unknown catalog level",origin);
   const ids={};
   for(const field of catalogFields[level]){
     const value=url.searchParams.get(field);
     if(!validIdentifier(value))return fail(400,"Invalid Autodesk identifier",origin);
     ids[field]=value;
   }
   const rawCursor=url.searchParams.get("cursor");
   let pageUrl=null;
   if(rawCursor){
     try{
       const cursor=await decodeCursor(rawCursor,env.key);
       if(cursor.userId!==user.id||cursor.level!==level||
          JSON.stringify(cursor.ids)!==JSON.stringify(ids)||
          cursor.expiresAt<Date.now()||!maxText(cursor.pageUrl,3000))
         return fail(400,"Stale Autodesk catalog cursor",origin);
       pageUrl=cursor.pageUrl;
     }catch{return fail(400,"Invalid Autodesk catalog cursor",origin)}
   }
   try{
     const token=await api.getAccessToken(user.id);
     if(!token)return fail(403,"Connect Autodesk first",origin);
     const result=await api.fetchCatalog({level,ids,accessToken:token,pageUrl});
     const nextCursor=result.nextLink?await encodeCursor({
       userId:user.id,level,ids,pageUrl:result.nextLink,
       expiresAt:Date.now()+10*60*1000
     },env.key):null;
     return json(200,{entries:result.entries,nextCursor},origin);
   }catch(error){
     return fail([401,403,404,429].includes(error?.status)?error.status:502,
       "Autodesk read-only catalog request failed",origin);
   }
 }
 return fail(405,"Method not allowed",origin);
}
