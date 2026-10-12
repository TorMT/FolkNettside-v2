/**
 * Autodesk Data Management read-only adapter (Node >=20).
 * The only allowed upstream host is developer.api.autodesk.com.
 * All IDs are supplied as path segments and encoded; remote pagination links
 * are not followed blindly.
 */
const ROOT="https://developer.api.autodesk.com";
const LEVELS={
  hubs: {path:()=>"/project/v1/hubs",required:[],type:"hub"},
  projects:{path:x=>"/project/v1/hubs/"+encodeURIComponent(x.hubId)+"/projects",
    required:["hubId"],type:"project"},
  topFolders:{path:x=>"/project/v1/hubs/"+encodeURIComponent(x.hubId)+
    "/projects/"+encodeURIComponent(x.projectId)+"/topFolders",
    required:["hubId","projectId"],type:"folder"},
  contents:{path:x=>"/data/v1/projects/"+encodeURIComponent(x.projectId)+
    "/folders/"+encodeURIComponent(x.folderId)+"/contents",
    required:["projectId","folderId"],type:null},
  versions:{path:x=>"/data/v1/projects/"+encodeURIComponent(x.projectId)+
    "/items/"+encodeURIComponent(x.itemId)+"/versions",
    required:["projectId","itemId"],type:"version"}
};
export const ApsLevels=Object.freeze(Object.keys(LEVELS));
const clean=s=>String(s??"").replace(/[\u0000-\u001f\u007f]/g,"").slice(0,320);
const validId=v=>typeof v==="string"&&v.length>0&&v.length<=600&&
  !/[\u0000-\u001f\u007f]/.test(v);

export function apsCatalogPath(level,ids={}){
  const entry=LEVELS[level];
  if(!entry)throw Error("Unsupported Autodesk catalog level");
  for(const key of entry.required)if(!validId(ids[key]))
    throw Error("Missing Autodesk identifier: "+key);
  return entry.path(ids);
}
export function validateApsNextLink(href,expectedPath){
  if(!href)return null;
  if(typeof href!=="string"||href.length>3000)throw Error("Invalid APS pagination");
  const target=new URL(href,ROOT);
  if(target.origin!==ROOT||target.pathname!==expectedPath||
    target.username||target.password||target.hash)
    throw Error("Untrusted APS pagination link");
  return target.toString();
}
export function normalizeApsCatalog(payload,level,expectedPath){
  if(!payload||!Array.isArray(payload.data)||payload.data.length>150)
    throw Error("Malformed or oversized APS catalog data");
  const entries=payload.data.flatMap(entry=>{
    if(!entry||!validId(entry.id))return [];
    const type=entry.type==="hubs"?"hub":
      entry.type==="projects"?"project":
      entry.type==="folders"?"folder":
      entry.type==="items"?"item":
      entry.type==="versions"?"version":null;
    if(!type)return [];
    const att=entry.attributes||{};
    const view=entry.links?.webView?.href;
    const result={id:entry.id,type,name:clean(att.displayName||att.name||entry.id),
      modifiedAt:clean(att.lastModifiedTime||att.createTime||"")};
    if(Number.isSafeInteger(att.versionNumber)&&att.versionNumber>=0)
      result.versionNumber=att.versionNumber;
    if(typeof view==="string"&&view.length<1500){
      try{
        const url=new URL(view);
        if(url.protocol==="https:"&&(
          url.hostname==="autodesk.com"||url.hostname.endsWith(".autodesk.com")||
          url.hostname.endsWith(".autodesk360.com")))
          result.webUrl=url.toString();
      }catch{}
    }
    return [result];
  });
  const nextLink=payload.links?.next?.href;
  return {entries,nextLink:validateApsNextLink(nextLink,expectedPath)};
}
/** Does not permit user-supplied arbitrary URLs; pageUrl is server-verified. */
export async function fetchApsCatalog({level,ids={},accessToken,pageUrl=null,
  fetchImpl=fetch,signal}={}){
  const path=apsCatalogPath(level,ids);
  const url=pageUrl?validateApsNextLink(pageUrl,path):ROOT+path;
  if(!validId(accessToken))throw Error("Missing authorized APS access token");
  const response=await fetchImpl(url,{
    method:"GET",
    headers:{Authorization:"Bearer "+accessToken,Accept:"application/vnd.api+json"},
    redirect:"error",signal
  });
  if(!response.ok){
    const error=new Error("Autodesk catalog request failed ("+response.status+")");
    error.status=[401,403,404,429].includes(response.status)?response.status:502;
    throw error;
  }
  const body=await response.json();
  return normalizeApsCatalog(body,level,path);
}
