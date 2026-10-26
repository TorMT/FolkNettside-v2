/** Owner-only, read-only relay for V1 PHP responses; no secret or token passthrough. */
const LEGACY_ORIGIN="https://tormt.folk.ntnu.no";
const V1_PATH="/includes/";
const ALLOWED_ORIGINS=new Set(["https://tormt.github.io","https://tormt.folk.ntnu.no"]);
const ALLOWED={
  "rapt/dashboard.php":{days:1},
  "brewing/recipes.php":{ingredients:1,id:1},
  "brewing/reference.php":{q:1},
  "brewing/logs.php":{slug:1}
};
const MAX_BYTES=4*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BEARER=/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const json=(status,body,origin)=>new Response(JSON.stringify(body),{status,headers:{
  ...HEADERS,...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})
}});
const failure=(status,message,origin)=>json(status,{error:message},origin);
const forbiddenKeys=new Set(["password","secret","apikey","api_key","access_token",
  "refreshtoken","refresh_token","clientsecret","client_secret","authorization",
  "googledriveauth","storageconfig","storageoptions","token","credentials"]);
export function redactLegacyPayload(obj,depth=0){
  if(depth>20)throw Error("Response too deeply nested");
  if(Array.isArray(obj))return obj.map(x=>redactLegacyPayload(x,depth+1));
  if(obj&&typeof obj==="object"){
    const out={};
    for(const [key,value] of Object.entries(obj)){
      const lower=key.replace(/[-_]/g,"").toLowerCase();
      if(forbiddenKeys.has(key.toLowerCase())||forbiddenKeys.has(lower))continue;
      out[key]=redactLegacyPayload(value,depth+1);
    }
    return out;
  }
  return obj;
}
export function buildUpstreamUrl(url){
  const source=new URL(url);
  const prefix="/legacy-brewing/";
  const index=source.pathname.lastIndexOf(prefix);
  if(index<0||source.pathname.indexOf(prefix)!==index)throw Error("Unsupported route");
  const relative=source.pathname.slice(index+prefix.length);
  if(!Object.hasOwn(ALLOWED,relative))throw Error("Unsupported service");
  const permitted=ALLOWED[relative],params=new URLSearchParams();
  for(const [key,value] of source.searchParams){
    if(!Object.hasOwn(permitted,key)||params.has(key))throw Error("Unsupported query");
    if(value.length>120)throw Error("Query too long");
    if(key==="days"){
      if(value==="max"){params.set("days","60");continue;}
      if(!/^[0-9]{1,2}$/.test(value)||Number(value)<1||Number(value)>60)throw Error("Invalid days");
    }else if(key==="slug"||key==="id"){
      if(!/^[a-z0-9_-]{1,80}$/i.test(value))throw Error("Invalid identifier");
    }else if(/[\u0000-\u001f<>]/.test(value))throw Error("Invalid query");
    params.set(key,value);
  }
  const u=new URL(V1_PATH+relative.replace("rapt/","rapt/api/").replace("brewing/","brewing/api/"),LEGACY_ORIGIN);
  u.search=params.toString();
  return {relative,url:u.href};
}
async function readBoundedJson(response){
  const type=response.headers.get("content-type")||"";
  if(!/application\/json|\+json/i.test(type))throw Error("Not JSON");
  if(Number(response.headers.get("content-length")||0)>MAX_BYTES)throw Error("Too large");
  const reader=response.body?.getReader();
  if(!reader){
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>MAX_BYTES)throw Error("Too large");
    return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  }
  const pieces=[];let total=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>MAX_BYTES)throw Error("Too large");
      pieces.push(value);
    }
  }finally{try{await reader.cancel()}catch{}}
  const bytes=new Uint8Array(total);let offset=0;
  for(const p of pieces){bytes.set(p,offset);offset+=p.byteLength;}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
}
export async function handleLegacyBrewingRequest(request,{verifyOwner,fetchUpstream=fetch}={}){
  const origin=request.headers.get("Origin");
  if(origin&&!ALLOWED_ORIGINS.has(origin))return failure(403,"Origin not permitted",null);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
    ...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{}),
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Max-Age":"300","Cache-Control":"no-store"
  }});
  if(request.method!=="GET")return failure(405,"V1 connection is read-only",origin);
  let target;
  try{target=buildUpstreamUrl(request.url);}
  catch{return failure(404,"Legacy service unavailable",origin);}
  const auth=request.headers.get("Authorization")||"";
  if(auth.length>8192||!BEARER.test(auth))
    return failure(401,"FolkNet owner sign-in required",origin);
  if(typeof verifyOwner!=="function")return failure(503,"Owner verification unavailable",origin);
  let owner;
  try{owner=await verifyOwner(auth.slice(7));}
  catch{return failure(503,"Owner verification unavailable",origin);}
  if(!owner?.id||!UUID.test(owner.id)||owner.admin!==true)
    return failure(owner?.id?403:401,"FolkNet administrator access required",origin);
  try{
    const response=await fetchUpstream(target.url,{
      method:"GET",redirect:"error",cache:"no-store",credentials:"omit",
      headers:{Accept:"application/json"},
      signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)return failure(502,"Legacy service did not return data",origin);
    const payload=await readBoundedJson(response);
    if(!payload||typeof payload!=="object"||Array.isArray(payload))
      throw Error("Unexpected response");
    let safe;
    if(target.relative==="rapt/dashboard.php"){
      if(!Array.isArray(payload.devices))throw Error("Invalid dashboard");
      safe={days:payload.days,generatedAt:payload.generatedAt,
        count:payload.devices.length,devices:payload.devices};
    }else if(target.relative==="brewing/recipes.php"){
      if(!Array.isArray(payload.recipes)&&!payload.recipe)throw Error("Invalid recipes");
      safe={recipes:payload.recipes,recipe:payload.recipe,count:payload.count,
        providers:payload.providers,catalogs:payload.catalogs};
    }else if(target.relative==="brewing/reference.php"){
      if(!Array.isArray(payload.references))throw Error("Invalid references");
      safe={references:payload.references,count:payload.count,providers:payload.providers};
    }else{
      if(!Array.isArray(payload.logs)&&!payload.log)throw Error("Invalid logs");
      safe={logs:payload.logs,log:payload.log,images:payload.images,folderUrl:payload.folderUrl};
    }
    return json(200,redactLegacyPayload(safe),origin);
  }catch{
    return failure(502,"Legacy service unavailable or invalid",origin);
  }
}
