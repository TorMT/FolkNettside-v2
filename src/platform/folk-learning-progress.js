/**
 * Explicit, non-sensitive learning progress backup under a FolkNet user UUID.
 * No automatic upload. A Google Drive access token is not a FolkNet JWT.
 * Server migration is intentionally not deployed until two-user RLS checks.
 */
import {getFolkAccessToken,getFolkAccountSnapshot,validateFolkAuthConfig}
 from "./folkside-auth.js?v=3a4cd95f7288d9435cba44f682313d690fae8a49";

const TYPES=["course","quiz","video"];
const isObj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const nonnegative=v=>Number.isFinite(v)&&v>=0&&v<=100_000_000;
const positiveInt=v=>Number.isSafeInteger(v)&&v>=0&&v<=1_000_000;
const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
const BLOCKED_SEGMENTS=/(?:beskyttet|protected|private|privat|secret|token|password|passord|credential)/i;
/** Use the original NTNU URL, not a temporary blob URL, as progress identity.
 *  A filename with encoded Norwegian characters or spaces must hash exactly
 *  like the equivalent same-origin relative path. Never download file bytes. */
export function canonicalNTNUProgressPath(resource){
 if(!isObj(resource)||resource.source!=="ntnu")
   throw Error("A public NTNU resource is required");
 const input=String(resource.url||resource.path||"");
 if(input.length>1800||input.includes("\\")||input.includes("?")||
    input.includes("#")||/[\u0000-\u001f\u007f]/.test(input))
   throw Error("Unsafe NTNU progress path");
 let path=input;
 if(input.startsWith("https://")){
   let url;
   try{url=new URL(input)}catch{throw Error("Unsafe NTNU progress URL")}
   if(url.origin!==NTNU_ORIGIN||url.username||url.password||
      url.search||url.hash||url.protocol!=="https:"||
      url.href!==input)
     throw Error("NTNU progress URL must use the approved origin");
   path=url.pathname;
 }else if(!input.startsWith("/semestre/")){
   throw Error("A stable NTNU resource path or approved progressId is required");
 }
 const rawParts=path.split("/").slice(1);
 if(rawParts.length<5||rawParts[0]!=="semestre"||
    !/^(?:[1-9]|1[0-9]|20)$/.test(rawParts[1])||
    !["filer","quiz"].includes(rawParts[3]))
   throw Error("Unsafe NTNU progress path");
 let parts;
 try{parts=rawParts.map(decodeURIComponent)}
 catch{throw Error("Invalid NTNU filename encoding")}
 if(parts.some((p,i)=>!p||p==="."||p===".."||
    p.startsWith(".")||p.startsWith("~$")||
    BLOCKED_SEGMENTS.test(p)||/[\/\\%?#\u0000-\u001f\u007f]/.test(p)||
    (i===1&&!/^(?:[1-9]|1[0-9]|20)$/.test(p))))
   throw Error("Unsafe NTNU progress path");
 // Encode every segment canonically, independently of URL-vs-local source.
 return "/"+parts.map(encodeURIComponent).join("/");
}
const stableID=resource=>{
 if(!isObj(resource))throw Error("Invalid progress resource");
 if(typeof resource.progressId==="string"&&
    /^folk:(course|quiz|video):[A-Za-z0-9_:/.-]{1,320}$/.test(resource.progressId))
   return resource.progressId;
 return "ntnu:"+canonicalNTNUProgressPath(resource);
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
 async function call(url,{method="GET",body,prefer,ownerId}={}){
   const assertOwner=()=>{
     if(identity()!==ownerId)
       throw Error("FolkNet account changed while loading progress. Reload before retrying.");
   };
   // The request must never carry a token for a different active account.
   assertOwner();
   const token=await tokenProvider();
   assertOwner();
   let response;
   try{
     response=await fetchImpl(url,{
       method,cache:"no-store",redirect:"error",
       signal:globalThis.AbortSignal?.timeout?.(10000),
       headers:{
         apikey:normalized.publishableKey,
         Authorization:"Bearer "+token,
         Accept:"application/json",
         ...(body?{"Content-Type":"application/json"}:{}),
         ...(prefer?{Prefer:prefer}:{})
       },
       ...(body?{body:JSON.stringify(body)}:{})
     });
   }catch(error){
     if(error?.name==="TimeoutError"||error?.name==="AbortError")
       throw Error("Progress request timed out. Reload before retrying.");
     throw error;
   }
   assertOwner();
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
   assertOwner();
   if(!Array.isArray(rows))throw Error("Unexpected progress response");
   return rows;
 }
 return {
   async read(kind,resource){
     const userId=identity();
     const key=await learningResourceKey(kind,resource,{cryptoImpl});
     const rows=await call(endpoint(userId,kind,key)+"&select=progress,revision,updated_at&limit=1",{ownerId:userId});
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
       rows=await call(base,{method:"POST",ownerId:userId,prefer:"return=representation",
         body:{user_id:userId,kind,resource_key:key,
           revision:1,progress:safe}});
     }else{
       rows=await call(endpoint(userId,kind,key)+"&revision=eq."+expectedRevision,{
         method:"PATCH",ownerId:userId,prefer:"return=representation",
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
