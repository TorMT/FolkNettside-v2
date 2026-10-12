/**
 * FolkNettside Supabase backend gate.
 * No sensitive data is returned without independent Supabase Auth verification.
 * The function uses bearer JWTs, not browser-shared Autodesk OAuth secrets.
 */
const ALLOWED_ORIGINS=new Set(["https://tormt.github.io"]);
const JSON_HEADERS={"Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const response=(status,body,origin)=>{
  const headers={...JSON_HEADERS,...(origin&&ALLOWED_ORIGINS.has(origin)?{
    "Access-Control-Allow-Origin":origin,"Vary":"Origin"
  }:{})};
  return new Response(JSON.stringify(body),{status,headers});
};
export function parseUserBearer(header){
  if(typeof header!=="string"||!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(header)
    ||header.length>8192)return null;
  return header.slice(7);
}
export async function handleFolkCoreRequest(request,{verifyUser}={}){
  const origin=request.headers.get("Origin");
  const allowed=!origin||ALLOWED_ORIGINS.has(origin);
  if(!allowed)return response(403,{error:"Origin not permitted"},null);
  if(request.method==="OPTIONS"){
    return new Response(null,{status:204,headers:{
      ...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{}),
      "Access-Control-Allow-Methods":"GET, OPTIONS",
      "Access-Control-Allow-Headers":"authorization, apikey, content-type",
      "Access-Control-Max-Age":"600",
      "Cache-Control":"no-store"
    }});
  }
  if(request.method!=="GET")return response(405,{error:"Read-only endpoint"},origin);
  const path=new URL(request.url).pathname.split("/").filter(Boolean).at(-1);
  if(path!=="health"&&path!=="session")
    return response(404,{error:"Unknown endpoint"},origin);
  const token=parseUserBearer(request.headers.get("Authorization"));
  if(!token)return response(401,{error:"Supabase sign-in required"},origin);
  try{
    if(typeof verifyUser!=="function")throw Error("Auth verifier unavailable");
    const user=await verifyUser(token);
    if(!user||typeof user.id!=="string"||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))
      return response(401,{error:"Invalid Supabase session"},origin);
    if(path==="health")
      return response(200,{ok:true,service:"folkside",database:"ready",
        protectedStorage:true,autodeskConnected:false},origin);
    return response(200,{connected:true,userId:user.id,
      autodeskConnected:false,storageBucket:"folk-private"},origin);
  }catch{
    // No raw upstream errors or credential content in user-visible responses.
    return response(503,{error:"Authentication service unavailable"},origin);
  }
}
