/**
 * Explicit, non-sensitive learning progress backup under a FolkNet user UUID.
 * No automatic upload. A Google Drive access token is not a FolkNet JWT.
 * Server migration is intentionally not deployed until two-user RLS checks.
 */
import {getFolkAccessToken,getFolkAccountSnapshot,validateFolkAuthConfig}
 from "./folkside-auth.js?v=6d607086d97957cd2aad874d59cc9c70ebaac62b";

const TYPES=["course","quiz","video"];
const isObj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const nonnegative=v=>Number.isFinite(v)&&v>=0&&v<=100_000_000;
const positiveInt=v=>Number.isSafeInteger(v)&&v>=0&&v<=1_000_000;
const stableID=resource=>{
 if(!isObj(resource))throw Error("Invalid progress resource");
 if(typeof resource.progressId==="string"&&
    /^folk:(course|quiz|video):[A-Za-z0-9_:/.-]{1,320}$/.test(resource.progressId))
   return resource.progressId;
 const path=resource.source==="ntnu"?(resource.path||resource.url):resource.path;
 if(typeof path!=="string"||!path.startsWith("/semestre/")||
    path.length>1400||path.includes("?")||path.includes("#")||
    path.includes("\\")||/(?:beskyttet|protected|private|privat|secret|token)/i.test(path))
   throw Error("A stable NTNU resource path or approved progressId is required");
 const parts=path.split("/").slice(1);
 if(parts.length<4||parts[0]!=="semestre"||
    !/^\d{1,2}$/.test(parts[1])||
    parts.some(x=>!x||x==="."||x===".."||/%2[fFeE]|%5[cC]/.test(x)))
   throw Error("Unsafe NTNU progress path");
 return "ntnu:"+path;
};
export async function learningResourceKey(kind,resource,{cryptoImpl=globalThis.crypto}={}){
 if(!TYPES.includes(kind))throw Error("Invalid progress kind");
 if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")
   throw Error("Secure crypto unavailable");
 const identity=kind+":"+stableID(resource);
 const bytes=new TextEncoder().encode(identity);
 const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
}

export function validateLearningProgress(kind,data){
 if(!TYPES.includes(kind)||!isObj(data))
   throw Error("Invalid learning progress record");
 let safe;
 if(kind==="video"){
   if(!nonnegative(data.position)||!nonnegative(data.duration)||
      data.position>data.duration+1||typeof data.watched!=="boolean")
     throw Error("Invalid video progress");
   safe={position:data.position,duration:data.duration,watched:data.watched};
 }else if(kind==="quiz"){
   if(!positiveInt(data.answered)||!positiveInt(data.total)||
      data.answered>data.total||!positiveInt(data.correct)||
      data.correct>data.answered||data.total>10000||
      typeof data.completed!=="boolean")
     throw Error("Invalid quiz progress");
   safe={answered:data.answered,total:data.total,
     correct:data.correct,completed:data.completed};
 }else{
   if(typeof data.completed!=="boolean")
     throw Error("Invalid course progress");
   safe={completed:data.completed};
 }
 if(typeof data.updatedAt!=="string"||!/^\d{4}-\d\d-\d\dT/.test(data.updatedAt)||
   !Number.isFinite(Date.parse(data.updatedAt)))
   throw Error("Progress update timestamp required");
 safe.updatedAt=new Date(data.updatedAt).toISOString();
 return safe;
}

export function createFolkLearningProgress({
 config,fetchImpl=fetch,tokenProvider=getFolkAccessToken,
 snapshotProvider=getFolkAccountSnapshot,cryptoImpl=globalThis.crypto
}={}){
 const normalized=validateFolkAuthConfig(config);
 if(!normalized)throw Error("Invalid FolkNet cloud configuration");
 const base=normalized.url+"/rest/v1/folk_learning_progress";
 const identity=()=>{
   const s=snapshotProvider();
   if(s.status!=="signed-in"||
      !/^[a-f0-9-]{36}$/i.test(s.user?.id||""))
     throw Error("Sign in to FolkNet before syncing progress");
   return s.user.id;
 };
 const endpoint=(userId,kind,key)=>{
   const u=new URL(base);
   u.searchParams.set("user_id","eq."+userId);
   u.searchParams.set("kind","eq."+kind);
   u.searchParams.set("resource_key","eq."+key);
   return u.toString();
 };
 async function call(url,{method="GET",body,prefer}={}){
   const token=await tokenProvider();
   const response=await fetchImpl(url,{
     method,cache:"no-store",
     headers:{
       apikey:normalized.publishableKey,
       Authorization:"Bearer "+token,
       Accept:"application/json",
       ...(body?{"Content-Type":"application/json"}:{}),
       ...(prefer?{Prefer:prefer}:{})
     },
     ...(body?{body:JSON.stringify(body)}:{})
   });
   if(!response.ok){
     const error=new Error(response.status===409?
       "Progress changed or already exists on another device. Reload before retrying.":
       response.status===401||response.status===403?
       "Your FolkNet account cannot access this progress.":
       "Learning progress request failed (HTTP "+response.status+").");
     error.status=response.status;
     throw error;
   }
   if(response.status===204)return [];
   const rows=await response.json();
   if(!Array.isArray(rows))throw Error("Unexpected progress response");
   return rows;
 }
 return {
   async read(kind,resource){
     const userId=identity();
     const key=await learningResourceKey(kind,resource,{cryptoImpl});
     const rows=await call(endpoint(userId,kind,key)+"&select=progress,revision,updated_at&limit=1");
     if(rows.length>1)throw Error("Unexpected number of progress records");
     if(!rows.length)return null;
     if(!Number.isSafeInteger(rows[0].revision)||rows[0].revision<1)
       throw Error("Invalid cloud revision");
     return {revision:rows[0].revision,
       progress:validateLearningProgress(kind,rows[0].progress),
       updatedAt:String(rows[0].updated_at||"")};
   },
   async save(kind,resource,data,{expectedRevision=null}={}){
     const userId=identity();
     const key=await learningResourceKey(kind,resource,{cryptoImpl});
     const safe=validateLearningProgress(kind,data);
     if(expectedRevision!==null&&
        (!Number.isSafeInteger(expectedRevision)||expectedRevision<1))
       throw Error("Invalid expected revision");
     let rows;
     if(expectedRevision===null){
       // PK constraint makes duplicate first writes fail rather than overwrite.
       rows=await call(base,{method:"POST",prefer:"return=representation",
         body:{user_id:userId,kind,resource_key:key,
           revision:1,progress:safe}});
     }else{
       rows=await call(endpoint(userId,kind,key)+"&revision=eq."+expectedRevision,{
         method:"PATCH",prefer:"return=representation",
         body:{revision:expectedRevision+1,progress:safe}});
     }
     if(rows.length!==1||rows[0]?.resource_key!==key||
        rows[0]?.user_id!==userId||rows[0]?.kind!==kind||
        rows[0]?.revision!==(expectedRevision===null?1:expectedRevision+1))
       throw Error("Cloud progress conflict or missing acknowledgment. Reload before retrying.");
     return {revision:rows[0].revision,progress:safe};
   }
 };
}
