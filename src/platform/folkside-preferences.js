/**
 * Manually triggered, non-sensitive Appearance backup over Supabase PostgREST.
 * Never store medicine or external OAuth tokens in folk_user_settings.
 * Writes are conditional on the observed row revision to avoid silent
 * concurrent overwrites from a second signed-in device.
 */
import {getFolkAccessToken,getFolkAccountSnapshot,validateFolkAuthConfig}
  from "./folkside-auth.js?v=1fff9a48acdb61912056574877967631693f4019";
export const APPEARANCE_FIELDS=Object.freeze({
  mode:["system","light","dark"],
  accent:["magenta","teal","blue","amber","graphite"],
  density:["comfortable","compact"],
  motion:["system","reduced"],
  contrast:["standard","high"]
});
export function validateCloudAppearance(input){
  if(!input||typeof input!=="object"||Array.isArray(input))
    throw Error("Invalid cloud Appearance settings");
  const result={};
  for(const [key,choices] of Object.entries(APPEARANCE_FIELDS)){
    if(!choices.includes(input[key]))
      throw Error("Unrecognized Appearance choice: "+key);
    result[key]=input[key];
  }
  return result;
}
export function appearanceEndpoint(config,userId){
  const c=validateFolkAuthConfig(config);
  if(!c||!/^[a-f0-9-]{36}$/i.test(userId))
    throw Error("Invalid signed-in FolkNet account");
  const u=new URL(c.url+"/rest/v1/folk_user_settings");
  u.searchParams.set("user_id","eq."+userId);
  u.searchParams.set("setting_key","eq.appearance");
  return u.toString();
}
export function createFolkAppearanceBackup({
  config,fetchImpl=fetch,tokenProvider=getFolkAccessToken,
  snapshotProvider=getFolkAccountSnapshot
}={}){
  const normalized=validateFolkAuthConfig(config);
  if(!normalized)throw Error("Invalid FolkNet cloud configuration");
  async function call(url,{method="GET",body,headers={}}={}){
    const token=await tokenProvider();
    const response=await fetchImpl(url,{
      method,cache:"no-store",
      headers:{
        apikey:normalized.publishableKey,
        Authorization:"Bearer "+token,
        Accept:"application/json",
        ...(body?{"Content-Type":"application/json"}:{}),
        ...headers
      },
      ...(body?{body:JSON.stringify(body)}:{})
    });
    if(!response.ok){
      const error=new Error(response.status===401||response.status===403?
        "Your FolkNet account cannot access this private backup.":
        "Private cloud request failed (HTTP "+response.status+").");
      error.status=response.status;
      throw error;
    }
    return response.status===204?[]:response.json();
  }
  const identity=()=>{
    const user=snapshotProvider().user;
    if(!user?.id)throw Error("Sign in before using cloud backup.");
    return user.id;
  };
  return {
    async read(){
      const result=await call(appearanceEndpoint(normalized,identity())+
        "&select=setting_value,revision,updated_at&limit=1");
      if(!Array.isArray(result)||result.length>1)
        throw Error("Unexpected private cloud response");
      if(!result.length)return null;
      const row=result[0];
      if(!Number.isSafeInteger(row.revision)||row.revision<1)
        throw Error("Invalid cloud backup revision");
      return {revision:row.revision,settings:validateCloudAppearance(row.setting_value),
        updatedAt:String(row.updated_at||"")};
    },
    async save(settings,{expectedRevision}={}){
      const safe=validateCloudAppearance(settings),userId=identity();
      if(expectedRevision!==null&&expectedRevision!==undefined&&
        (!Number.isSafeInteger(expectedRevision)||expectedRevision<1))
        throw Error("Invalid expected cloud revision");
      const at=appearanceEndpoint(normalized,userId);
      const now=new Date().toISOString();
      if(expectedRevision===undefined||expectedRevision===null){
        // First backup only. If another device already owns this key,
        // fail with Postgres 409 instead of unconditional overwrite.
        const result=await call(normalized.url+"/rest/v1/folk_user_settings",{
          method:"POST",
          headers:{Prefer:"return=representation"},
          body:{user_id:userId,setting_key:"appearance",
            setting_value:safe,revision:1,updated_at:now}
        });
        if(!Array.isArray(result)||result.length!==1)
          throw Error("Cloud backup was not acknowledged");
        return {revision:1,settings:safe};
      }
      const result=await call(at+"&revision=eq."+expectedRevision,{
        method:"PATCH",
        headers:{Prefer:"return=representation"},
        body:{setting_value:safe,revision:expectedRevision+1,updated_at:now}
      });
      if(!Array.isArray(result)||result.length!==1)
        throw Error("Cloud backup changed on another device. Reload the backup before retrying.");
      return {revision:expectedRevision+1,settings:safe};
    }
  };
}
