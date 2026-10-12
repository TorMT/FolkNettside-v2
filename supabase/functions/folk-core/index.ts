import {handleFolkCoreRequest} from "./core.js";

// Gateway JWT validation is intentionally disabled for this endpoint to
// allow browser CORS preflight. Every data-bearing route independently
// verifies the Supabase Auth bearer token at /auth/v1/user.
async function verifyUser(accessToken:string){
  const url=Deno.env.get("SUPABASE_URL");
  const apiKey=Deno.env.get("SUPABASE_ANON_KEY");
  if(!url||!apiKey)throw Error("Supabase backend auth not configured");
  const response=await fetch(url+"/auth/v1/user",{
    method:"GET",headers:{
      "apikey":apiKey,"Authorization":"Bearer "+accessToken,
      "Accept":"application/json"
    },redirect:"error",cache:"no-store",
    signal:AbortSignal.timeout(8000)
  });
  if(response.status===401||response.status===403)return null;
  if(!response.ok)throw Error("Supabase Auth unavailable");
  const user=await response.json();
  return typeof user?.id==="string"?{id:user.id}:null;
}

Deno.serve((request:Request)=>handleFolkCoreRequest(request,{verifyUser}));
