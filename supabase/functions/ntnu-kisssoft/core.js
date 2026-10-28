/** Strictly read-only relay for four already indexed public NTNU KISSsoft files.
 * No arbitrary URLs, directory traversal, NTNU credentials or cookie forwarding.
 * A new file requires explicit review and a new allowlist deployment.
 */
export const APPROVED_PUBLIC_KISSSOFT_PATHS=Object.freeze([
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/RingOgPinionMaskineriProsjekt.Z12",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage1PlanetaryGear.Z14",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage2PlanetaryGear.Z14",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage3PlanetaryGear.Z14"
]);
const APPROVED=new Set(APPROVED_PUBLIC_KISSSOFT_PATHS);
const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
const ORIGINS=new Set(["https://tormt.github.io","https://tormt.folk.ntnu.no"]);
const MAX_BYTES=12_000_000;
const TYPE="application/octet-stream";
function cors(origin){return origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{}}
function error(status,message,origin){
 return new Response(JSON.stringify({error:message}),{status,headers:{
  ...cors(origin),"Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
 }});
}
export function resolvePublicKisssoftPath(requestURL){
 const url=new URL(requestURL);
 if(url.hash||[...url.searchParams].length!==1||
    !url.searchParams.has("path"))throw Error("Invalid relay request");
 const path=url.searchParams.get("path");
 if(!APPROVED.has(path))throw Error("Not an approved public KISSsoft file");
 return path;
}
async function readBounded(response){
 const declared=Number(response.headers.get("content-length")||0);
 if(!Number.isFinite(declared)||declared>MAX_BYTES)
   throw new RangeError("KISSsoft file too large");
 const reader=response.body?.getReader();
 if(!reader){
  const data=await response.arrayBuffer();
  if(data.byteLength>MAX_BYTES)throw new RangeError("KISSsoft file too large");
  return new Uint8Array(data);
 }
 const chunks=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_BYTES)throw new RangeError("KISSsoft file too large");
   chunks.push(value);
  }
 }finally{try{await reader.cancel()}catch{}}
 const data=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
 return data;
}
export async function handlePublicKisssoftRequest(request,{fetchUpstream=fetch}={}){
 const origin=request.headers.get("Origin");
 if(origin&&!ORIGINS.has(origin))return error(403,"Origin not permitted",null);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
  ...cors(origin),"Access-Control-Allow-Methods":"GET, OPTIONS",
  "Access-Control-Allow-Headers":"content-type","Access-Control-Max-Age":"300",
  "Cache-Control":"no-store"
 }});
 if(request.method!=="GET")return error(405,"Read-only endpoint",origin);
 let path;
 try{path=resolvePublicKisssoftPath(request.url)}
 catch{return error(404,"Public KISSsoft file not approved",origin)}
 try{
  const response=await fetchUpstream(NTNU_ORIGIN+path,{
   method:"GET",redirect:"error",cache:"no-store",credentials:"omit",
   headers:{Accept:"application/octet-stream, text/plain;q=0.9"},
   signal:AbortSignal.timeout(18000)
  });
  if(!response.ok)return error(502,"Public NTNU file unavailable",origin);
  const contentType=response.headers.get("content-type")||"";
  if(/text\/html|application\/xhtml\+xml/i.test(contentType))
    return error(502,"NTNU did not return a KISSsoft file",origin);
  const bytes=await readBounded(response);
  const opening=new TextDecoder("latin1").decode(bytes.subarray(0,80)).trimStart().toLowerCase();
  if(opening.startsWith("<!doctype")||opening.startsWith("<html")||
     opening.startsWith("<head"))return error(502,"NTNU returned HTML, not KISSsoft data",origin);
  return new Response(bytes,{status:200,headers:{
   ...cors(origin),"Content-Type":TYPE,"X-Content-Type-Options":"nosniff",
   "Content-Length":String(bytes.byteLength),
   "Cache-Control":"public, max-age=300","Content-Disposition":"inline"
  }});
 }catch(e){
  return error(e instanceof RangeError?413:502,
   e instanceof RangeError?"KISSsoft file exceeds the 12 MB preview limit":"Public NTNU file unavailable",origin);
 }
}
