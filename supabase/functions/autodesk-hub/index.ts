// Supabase Edge Function. APS and DB credentials exist ONLY as Edge secrets.
// Callback must be reachable without a bearer JWT; every other data route
// independently authenticates against Supabase Auth.
import postgres from "npm:postgres@3.4.5";
import {handleAutodeskHubRequest,openJSON,sealJSON} from "./core.js";
import {fetchApsCatalog} from "./aps-catalog.js";

const env={
 clientId:Deno.env.get("APS_CLIENT_ID")||"",
 clientSecret:Deno.env.get("APS_CLIENT_SECRET")||"",
 redirectUri:Deno.env.get("APS_REDIRECT_URI")||"",
 key:Deno.env.get("FOLK_AUTODESK_TOKEN_KEY")||""
};
const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")||
 Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const dbUrl=Deno.env.get("SUPABASE_DB_URL")||"";
const db=dbUrl?postgres(dbUrl,{prepare:false,max:2,idle_timeout:10,
 connect_timeout:8}):null;

async function verifyUser(token:string){
 if(!supabaseUrl||!anonKey)throw Error("Missing Supabase auth config");
 const response=await fetch(supabaseUrl+"/auth/v1/user",{
   headers:{apikey:anonKey,Authorization:"Bearer "+token},
   method:"GET",redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(8000)
 });
 if(response.status===401||response.status===403)return null;
 if(!response.ok)throw Error("Authentication service unavailable");
 const info=await response.json();
 return {id:info?.id};
}
function getDB(){
 if(!db)throw Error("Backend DB URL unavailable");
 return db;
}
const store={
 async savePending(p:any){
   const sql=getDB();
   await sql`insert into private.folk_oauth_pending
    (state_hash,user_id,pkce_verifier_ciphertext,nonce,key_version,
     return_to,expires_at)
    values (${p.stateHash},${p.userId},decode(${p.ciphertext},'hex'),
     decode(${p.nonce},'hex'),1,${p.returnTo},${p.expiresAt}::timestamptz)`;
 },
 async consumePending(hash:string){
   const sql=getDB();
   const rows=await sql`delete from private.folk_oauth_pending
    where state_hash=${hash} and expires_at>now()
    returning user_id::text as "userId",return_to as "returnTo",
      expires_at::text as "expiresAt",
      encode(pkce_verifier_ciphertext,'hex') as "ciphertext",
      encode(nonce,'hex') as "nonce"`;
   return rows[0]||null;
 },
 async hasConnection(userId:string){
   const sql=getDB();
   const r=await sql`select 1 from private.folk_oauth_connections
     where user_id=${userId}::uuid and provider='autodesk' limit 1`;
   return r.length>0;
 },
 async deleteConnection(userId:string){
   const sql=getDB();
   await sql`delete from private.folk_oauth_connections
    where user_id=${userId}::uuid and provider='autodesk'`;
 },
 async saveConnection(userId:string,record:any){
   const sql=getDB();
   await sql`insert into private.folk_oauth_connections
     (user_id,provider,token_ciphertext,token_nonce,token_key_version,
      token_expires_at)
     values(${userId}::uuid,'autodesk',decode(${record.ciphertext},'hex'),
      decode(${record.nonce},'hex'),1,null)
     on conflict(user_id,provider) do update
       set token_ciphertext=excluded.token_ciphertext,
           token_nonce=excluded.token_nonce,
           token_key_version=excluded.token_key_version,
           token_expires_at=excluded.token_expires_at,
           updated_at=now()`;
 }
};

const APS_TOKEN_URL="https://developer.api.autodesk.com/authentication/v2/token";
async function tokenRequest(values:Record<string,string>){
 const basic=btoa(env.clientId+":"+env.clientSecret);
 const response=await fetch(APS_TOKEN_URL,{
   method:"POST",headers:{
     "Authorization":"Basic "+basic,
     "Content-Type":"application/x-www-form-urlencoded",
     "Accept":"application/json"
   },body:new URLSearchParams(values),redirect:"error",
   signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw Error("Autodesk token request rejected");
 return response.json();
}

async function getAccessToken(userId:string){
 const sql=getDB();
 // Serializes refresh-token rotation for the same account across parallel
 // catalog calls, not just inside one Edge Function isolate.
 return sql.begin(async(tx:any)=>{
   await tx`select pg_advisory_xact_lock(hashtextextended(${userId}, 937))`;
   const rows=await tx`select encode(token_ciphertext,'hex') as "ciphertext",
        encode(token_nonce,'hex') as "nonce",token_key_version
     from private.folk_oauth_connections
     where user_id=${userId}::uuid and provider='autodesk' for update`;
   if(!rows.length)return null;
   if(rows[0].token_key_version!==1)throw Error("Unsupported key version");
   const token=await openJSON(rows[0],env.key,"user:"+userId);
   if(typeof token?.accessToken!=="string"||
      typeof token?.refreshToken!=="string")
     throw Error("Invalid encrypted Autodesk session");
   if(token.expiresAt>Date.now()+90_000)return token.accessToken;
   const updated=await tokenRequest({grant_type:"refresh_token",
     refresh_token:token.refreshToken,scope:"data:read"});
   if(typeof updated?.access_token!=="string"||
     !Number.isFinite(updated?.expires_in)||updated.expires_in<=0)
      throw Error("Autodesk refresh failed");
   const next={
     accessToken:updated.access_token,
     refreshToken:updated.refresh_token||token.refreshToken,
     expiresAt:Date.now()+updated.expires_in*1000
   };
   const enc=await sealJSON(next,env.key,"user:"+userId);
   await tx`update private.folk_oauth_connections
     set token_ciphertext=decode(${enc.ciphertext},'hex'),
         token_nonce=decode(${enc.nonce},'hex'),
         token_expires_at=to_timestamp(${next.expiresAt}/1000.0),
         updated_at=now()
     where user_id=${userId}::uuid and provider='autodesk'`;
   return next.accessToken;
 });
}

Deno.serve((request:Request)=>handleAutodeskHubRequest(request,{
 env,store,verifyUser,
 exchange:({code,verifier}:{code:string,verifier:string})=>
   tokenRequest({grant_type:"authorization_code",code,code_verifier:verifier,
     redirect_uri:env.redirectUri}),
 getAccessToken,fetchCatalog:fetchApsCatalog
}).catch(()=>new Response(JSON.stringify({error:"Autodesk service unavailable"}),{
 status:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store",
 "X-Content-Type-Options":"nosniff"}
})));
