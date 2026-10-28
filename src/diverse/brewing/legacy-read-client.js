import {
  getFolkAccessToken,getFolkAccountSnapshot,validateFolkAuthConfig
} from "../../platform/folkside-auth.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";

export const LEGACY_READ_BASE=
  "https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/legacy-brewing/";
const FILES={
  rapt:new Set(["dashboard.php"]),
  brewing:new Set(["recipes.php","reference.php","logs.php"])
};
/** All other PHP routes, especially writes and secrets, are denied. */
export function legacyReadEndpoint(config,service,file){
  if(config?.legacyReadProxy?.enabled!==true||
      config?.legacyReadProxy?.base!==LEGACY_READ_BASE||
      !Object.hasOwn(FILES,service)||!FILES[service].has(file))return null;
  return LEGACY_READ_BASE+service+"/"+file;
}
export function isLegacyProxyUrl(value){
  try{
    const uri=new URL(value);
    return uri.origin==="https://aeuouzkiyddfjtjfdosp.supabase.co"&&
      uri.pathname.startsWith("/functions/v1/legacy-brewing/")&&
      !uri.username&&!uri.password&&!uri.hash;
  }catch{return false}
}

/** Only requests targeting our pinned proxy receive the FolkNet bearer. */
export async function folkBrewingFetch(input,init={},{
  fetchImpl=fetch,
  configLoader=()=>fetchImpl("./data/folkside-auth.json",{cache:"no-store",redirect:"error"}).then(r=>r.ok?r.json():null),
  tokenProvider=getFolkAccessToken,
  snapshotProvider=getFolkAccountSnapshot
}={}){
  if(!isLegacyProxyUrl(input))return fetchImpl(input,init);
  if((init.method||"GET").toUpperCase()!=="GET")
    throw Error("Legacy connection is read-only");
  const initial=snapshotProvider();
  if(initial.status!=="signed-in"||!initial.user?.id)
    throw Error("Sign in to your FolkNet owner account to read legacy Brewing data.");
  const config=validateFolkAuthConfig(await configLoader());
  if(!config)throw Error("FolkNet Auth backend is not configured");
  const token=await tokenProvider();
  if(snapshotProvider().user?.id!==initial.user.id)
    throw Error("FolkNet account changed while preparing the request");
  const headers=new Headers(init.headers||{});
  headers.set("apikey",config.publishableKey);
  headers.set("Authorization","Bearer "+token);
  headers.set("Accept","application/json");
  const response=await fetchImpl(input,{...init,method:"GET",headers,
    cache:"no-store",redirect:"error",credentials:"omit",mode:"cors",
    signal:init.signal||AbortSignal.timeout(18000)});
  if(snapshotProvider().status!=="signed-in"||
      snapshotProvider().user?.id!==initial.user.id)
    throw Error("FolkNet account changed during the request");
  return response;
}
