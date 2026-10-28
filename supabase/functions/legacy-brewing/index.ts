import {handleLegacyBrewingRequest} from "./core.js";

// verify_jwt=false to support browser CORS preflight. Every data read checks
// a real Supabase Auth bearer and RLS-protected owner admin membership.
async function verifyOwner(token:string){
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if(!url||!key||new URL(url).hostname!=="aeuouzkiyddfjtjfdosp.supabase.co")
    throw Error("Supabase project not configured");
  const headers={"apikey":key,"Authorization":"Bearer "+token,"Accept":"application/json"};
  const userResponse=await fetch(url+"/auth/v1/user",{
    headers,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)
  });
  if(userResponse.status===401||userResponse.status===403)return null;
  if(!userResponse.ok)throw Error("Auth service unavailable");
  const user=await userResponse.json();
  if(!/^[0-9a-f-]{36}$/i.test(String(user?.id||"")))return null;
  const check=await fetch(url+"/rest/v1/folk_site_admins?select=user_id,slot&user_id=eq."
    +encodeURIComponent(user.id)+"&limit=1",{
    headers,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)
  });
  if(!check.ok)throw Error("Admin authorization service unavailable");
  const rows=await check.json();
  return {id:user.id,admin:Array.isArray(rows)&&rows.some(
    row=>row.user_id===user.id&&row.slot===1)};
}

Deno.serve((request:Request)=>handleLegacyBrewingRequest(request,{verifyOwner}));
