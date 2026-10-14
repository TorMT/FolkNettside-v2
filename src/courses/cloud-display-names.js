/**
 * Public course-label overlay and admin-only publishing.
 * Authorization is enforced by Supabase RLS, never by UI visibility.
 * The NTNU URLs, slugs and original files are never written here.
 */
import {validateFolkAuthConfig,initializeFolkAccount,getFolkAccountUser,
  getFolkAccessToken} from "../platform/folkside-auth.js";
import {validateNTNUDisplayNames} from "./ntnu-display-names.js";

const CONFIG="./data/folkside-auth.json";
const TABLE="course_display_config";
const jsonHeaders=key=>({apikey:key,Accept:"application/json"});
async function configFor(fetchImpl,configLoader){
 const data=configLoader?await configLoader():
   await fetchImpl(CONFIG,{cache:"no-store"}).then(r=>r.ok?r.json():null);
 const config=validateFolkAuthConfig(data);
 if(!config)throw Error("FolkNet Supabase is not configured.");
 return config;
}
async function readResponse(response){
 if(!response.ok){
   const payload=await response.json().catch(()=>null);
   const reason=typeof payload?.message==="string"?payload.message:
     typeof payload?.error_description==="string"?payload.error_description:
     "HTTP "+response.status;
   throw Error("FolkNet backend: "+reason.slice(0,180));
 }
 return response.json();
}
/** Public-readable. Return null when the database has not been bootstrapped. */
export async function loadCloudDisplayNames({fetchImpl=fetch,configLoader=null}={}){
 const {url,publishableKey}=await configFor(fetchImpl,configLoader);
 const response=await fetchImpl(url+"/rest/v1/"+TABLE+"?id=eq.main&select=aliases",{
   cache:"no-store",headers:jsonHeaders(publishableKey)
 });
 const items=await readResponse(response);
 if(!Array.isArray(items)||!items.length)return null;
 if(items.length!==1)throw Error("Ambiguous public display-name config");
 return validateNTNUDisplayNames(items[0].aliases);
}
/** Admin lookup may not rely on user-editable metadata or a UI role flag. */
export async function isFolkCourseAdmin({fetchImpl=fetch,configLoader=null}={}){
 await initializeFolkAccount();
 const user=await getFolkAccountUser();
 const token=await getFolkAccessToken();
 const {url,publishableKey}=await configFor(fetchImpl,configLoader);
 const response=await fetchImpl(url+"/rest/v1/folk_admins?user_id=eq."+
   encodeURIComponent(user.id)+"&select=user_id",{
   cache:"no-store",
   headers:{...jsonHeaders(publishableKey),Authorization:"Bearer "+token}
 });
 const items=await readResponse(response);
 return Array.isArray(items)&&items.length===1&&items[0].user_id===user.id;
}
/** Save one complete validated snapshot; RLS separately verifies permission. */
export async function saveCloudDisplayNames(names,{
 fetchImpl=fetch,configLoader=null
}={}){
 const aliases=validateNTNUDisplayNames(names);
 await initializeFolkAccount();
 const token=await getFolkAccessToken();
 const {url,publishableKey}=await configFor(fetchImpl,configLoader);
 const response=await fetchImpl(url+"/rest/v1/"+TABLE+"?on_conflict=id",{
   method:"POST",cache:"no-store",
   headers:{...jsonHeaders(publishableKey),Authorization:"Bearer "+token,
     "Content-Type":"application/json",
     Prefer:"resolution=merge-duplicates,return=representation"},
   body:JSON.stringify({id:"main",aliases})
 });
 const rows=await readResponse(response);
 if(!Array.isArray(rows)||rows.length!==1||rows[0].id!=="main")
   throw Error("FolkNet did not confirm the saved configuration.");
 return validateNTNUDisplayNames(rows[0].aliases);
}
