/**
 * Read-only Autodesk Fusion Hub catalog client.
 *
 * IMPORTANT: Calls the application's OWN authenticated backend. The public
 * GitHub Pages UI never receives an Autodesk access/refresh token, app secret
 * or downloadable signed URL, and never calls APS directly.
 *
 * Backend contract:
 * GET {base}/session -> {connected:boolean,displayName?:string}
 * GET {base}/catalog?level=hubs|projects|topFolders|contents|versions
 *   &hubId=...&projectId=...&folderId=...&itemId=...
 *   -> {entries:[{id,name,type,versionNumber?,modifiedAt?,webUrl?}],nextCursor?:string}
 *
 * All remote fields are treated as untrusted. The backend must authenticate
 * the user, authorize each ID against Autodesk, and prevent open redirects.
 */
import {getFolkAccessToken} from "./folkside-auth.js?v=7ab27b1cea88b94f4c586c9b1fd9d1305bcf2dc7";

const LEVELS=new Set(["hubs","projects","topFolders","contents","versions"]);
const FIELDS={hubs:[],projects:["hubId"],topFolders:["hubId","projectId"],
  contents:["projectId","folderId"],versions:["projectId","itemId"]};
const id=v=>typeof v==="string"&&v.length>0&&v.length<=600&&
  !/[\u0000-\u001f\u007f]/.test(v);
const safeText=v=>String(v??"").slice(0,320).replace(/[\u0000-\u001f\u007f]/g,"");
export function validateHubConfig(input,{origin}={}){
 if(!input||typeof input!=="object"||!input.apiBase)
   return {enabled:false,reason:"Autodesk backend is not configured"};
 const base=String(input.apiBase).trim();
 let url;
 try{url=new URL(base,origin||"https://tormt.github.io")}
 catch{throw Error("Invalid Autodesk API backend URL")}
 if(url.protocol!=="https:"&&!(url.protocol==="http:"&&url.hostname==="localhost"))
   throw Error("Autodesk API backend must use HTTPS");
 if(url.username||url.password||url.hash||url.search)
   throw Error("Autodesk backend URL cannot contain credentials, query or fragment");
 if(!url.pathname.endsWith("/"))url.pathname+="/";
 const authMode=input.authMode==="folknet"?"folknet":"cookie";
 // A FolkNet Supabase JWT is sensitive: never send it to a configurable URL.
 if(authMode==="folknet"&&(url.origin!=="https://glfuvfmppkjmarujjqwg.supabase.co"||
   url.pathname!=="/functions/v1/autodesk-hub/"))
   throw Error("FolkNet bearer auth requires the exact first-party Supabase function");
 return {enabled:true,apiBase:url.toString(),authMode,reason:""};
}
export function normalizeHubEntry(entry){
 if(!entry||!id(entry.id)||!["hub","project","folder","item","version"].includes(entry.type))
   throw Error("Invalid Autodesk catalog entry");
 const output={
   id:entry.id,type:entry.type,name:safeText(entry.name||entry.id),
   modifiedAt:safeText(entry.modifiedAt||""),
   versionNumber:Number.isSafeInteger(entry.versionNumber)&&entry.versionNumber>=0?
     entry.versionNumber:null
 };
 if(entry.webUrl){
   try{
     const link=new URL(String(entry.webUrl));
     if(link.protocol==="https:"&&
       (link.hostname==="autodesk.com"||link.hostname.endsWith(".autodesk.com")||
        link.hostname.endsWith(".autodesk360.com")||
        link.hostname.endsWith(".fusionteam.autodesk.com")))
       output.webUrl=link.toString();
   }catch{ /* Invalid or unsupported web views stay unavailable. */ }
 }
 return output;
}
export function parseCatalogResponse(body,{maxEntries=150}={}){
 if(!body||!Array.isArray(body.entries)||body.entries.length>maxEntries)
   throw Error("Malformed or oversized Autodesk hub response");
 const entries=body.entries.map(normalizeHubEntry);
 if(body.nextCursor!==undefined&&body.nextCursor!==null&&!(typeof body.nextCursor==="string"&&body.nextCursor.length<=6000&&
    /^[A-Za-z0-9_.-]+$/.test(body.nextCursor)))
   throw Error("Invalid Autodesk pagination cursor");
 return {entries,nextCursor:body.nextCursor||null};
}
export function catalogRequestURL(base,level,ids={},cursor=null){
 if(!LEVELS.has(level))throw Error("Unsupported Autodesk catalog level");
 const u=new URL(base);
 u.pathname+="catalog";
 u.searchParams.set("level",level);
 for(const name of FIELDS[level]){
   if(!id(ids[name]))throw Error("Missing required Autodesk catalog identifier: "+name);
   u.searchParams.set(name,ids[name]);
 }
 if(cursor){
   if(typeof cursor!=="string"||cursor.length>6000||
      !/^[A-Za-z0-9_.-]+$/.test(cursor))throw Error("Invalid Autodesk catalog cursor");
   u.searchParams.set("cursor",cursor);
 }
 return u.toString();
}
export function createAutodeskHubClient(config,{
 fetchImpl=fetch,tokenProvider=getFolkAccessToken
}={}){
 const settings=validateHubConfig(config,{origin:
   typeof location==="undefined"?"https://tormt.github.io":location.origin});
 if(!settings.enabled)throw Error(settings.reason);
 const getJSON=async(url,{signal,method="GET",body}={})=>{
   const headers={Accept:"application/json"};
   if(settings.authMode==="folknet"){
     const token=await tokenProvider();
     if(typeof token!=="string"||token.length<20)
       throw Error("Sign in to FolkNet before connecting Autodesk");
     headers.Authorization="Bearer "+token;
   }
   if(body)headers["Content-Type"]="application/json";
   const response=await fetchImpl(url,{method,mode:"cors",
     ...(settings.authMode==="cookie"?{credentials:"include"}:{credentials:"omit"}),
     headers,cache:"no-store",signal,
     ...(body?{body:JSON.stringify(body)}:{})});
   if(response.status===401||response.status===403)
     throw Object.assign(Error("Autodesk authorization required"),{status:response.status});
   if(!response.ok)throw Error("Autodesk backend error: HTTP "+response.status);
   const result=await response.json();
   if(!result||typeof result!=="object")throw Error("Invalid Autodesk backend response");
   return result;
 };
 return {
   async session({signal}={}){
     const result=await getJSON(settings.apiBase+"session",{signal});
     return {connected:result.connected===true,
       configured:result.configured!==false,
       displayName:safeText(result.displayName)};
   },
   async catalog(level,ids={}, {cursor=null,signal}={}){
     return parseCatalogResponse(await getJSON(
       catalogRequestURL(settings.apiBase,level,ids,cursor),{signal}));
   },
   loginURL(){
     const url=new URL(settings.apiBase+"login");
     // Login callback must be validated by the backend against allowlisted
     // origins. Do not place arbitrary private URLs in this parameter.
     if(typeof location!=="undefined")
       url.searchParams.set("returnTo",location.origin+location.pathname+
         (location.hash||"#/engineering/cad"));
     return url.toString();
   },
   async startAuthorization({signal,returnTo}={}){
     if(settings.authMode!=="folknet")return this.loginURL();
     const target=returnTo||"https://tormt.github.io/FolkNettside-v2/#/engineering/cad";
     const result=await getJSON(settings.apiBase+"authorize",{
       signal,method:"POST",body:{returnTo:target}
     });
     const url=new URL(String(result.authorizationUrl||""));
     if(url.origin!=="https://developer.api.autodesk.com"||
        url.pathname!=="/authentication/v2/authorize")
       throw Error("Autodesk authorization URL rejected");
     return url.toString();
   },
   get base(){return settings.apiBase}
 };
}
