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
 return {enabled:true,apiBase:url.toString(),reason:""};
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
 if(body.nextCursor!==undefined&&body.nextCursor!==null&&!id(body.nextCursor))
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
   if(!id(cursor))throw Error("Invalid Autodesk catalog cursor");
   u.searchParams.set("cursor",cursor);
 }
 return u.toString();
}
export function createAutodeskHubClient(config,{fetchImpl=fetch}={}){
 const settings=validateHubConfig(config,{origin:
   typeof location==="undefined"?"https://tormt.github.io":location.origin});
 if(!settings.enabled)throw Error(settings.reason);
 const getJSON=async(url,{signal}={})=>{
   const response=await fetchImpl(url,{method:"GET",mode:"cors",credentials:"include",
     headers:{Accept:"application/json"},cache:"no-store",signal});
   if(response.status===401||response.status===403)
     throw Object.assign(Error("Autodesk authorization required"),{status:response.status});
   if(!response.ok)throw Error("Autodesk backend error: HTTP "+response.status);
   const body=await response.json();
   if(!body||typeof body!=="object")throw Error("Invalid Autodesk backend response");
   return body;
 };
 return {
   async session({signal}={}){
     const result=await getJSON(settings.apiBase+"session",{signal});
     return {connected:result.connected===true,displayName:safeText(result.displayName)};
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
   get base(){return settings.apiBase}
 };
}
