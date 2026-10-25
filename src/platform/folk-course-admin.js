/**
 * Optional, public cosmetic NTNU labels stored in the dedicated FolkNet Supabase project.
 * Public read; only allowlisted Supabase Auth users can write, enforced by Postgres RLS.
 * NTNU files/paths are never modified by this module.
 */
import {validateNTNUDisplayNames} from "../courses/ntnu-display-names.js?v=34444ab65da3d9289cb134f51bb898853374ecb2";
import {validateFolkAuthConfig,getFolkAccessToken,getFolkAccountSnapshot} from "./folkside-auth.js?v=34444ab65da3d9289cb134f51bb898853374ecb2";

const KINDS=new Set(["course-title","course-description","section","file"]);
const MAX_ROWS=5000;
function validRow(row){
  if(!row||!KINDS.has(row.kind)||typeof row.key!=="string"||
     typeof row.label!=="string"||!row.label.trim()||
     row.label.length>(row.kind==="course-description"?300:row.kind==="course-title"?130:160)||
     /[<>\u0000-\u001f\u007f]/.test(row.label)||
     row.key.length>1600||!/^([1-9]|1[0-9]|20)\//.test(row.key))return false;
  const parts=row.key.split("/");
  if(parts.length<(row.kind==="course-title"||row.kind==="course-description"?2:3)||
     parts.some((p,i)=>i&&(!p||p==="."||p===".."||p.startsWith(".")||p.startsWith("~$")||
       /[\\%?#\u0000-\u001f\u007f]/.test(p))))return false;
  if((row.kind==="course-title"||row.kind==="course-description")&&parts.length!==2)return false;
  return true;
}
export function mergeCloudCourseLabels(base,rows){
  const safe=validateNTNUDisplayNames(base);
  if(!Array.isArray(rows)||rows.length>MAX_ROWS)throw Error("Invalid site-label table");
  const overlay={...safe,courses:{...safe.courses},sections:{...safe.sections},
    folders:{...safe.folders},files:{...safe.files}};
  for(const row of rows){
    if(!validRow(row))throw Error("Invalid cloud course label");
    const label=row.label.trim();
    if(row.kind==="course-title"||row.kind==="course-description"){
      const field=row.kind==="course-title"?"title":"description";
      overlay.courses[row.key]={...(overlay.courses[row.key]||{}),[field]:label};
    }else if(row.kind==="section")overlay.sections[row.key]=label;
    else if(row.kind==="file")overlay.files[row.key]=label;
  }
  return validateNTNUDisplayNames(overlay);
}

async function setup({fetchImpl=fetch,configLoader=null}={}){
  const raw=configLoader?await configLoader():await fetchImpl("./data/folkside-auth.json",{cache:"no-store"})
    .then(r=>{if(!r.ok)throw Error("FolkNet auth configuration unavailable");return r.json()});
  const config=validateFolkAuthConfig(raw);
  if(!config)throw Error("FolkNet Supabase is not configured");
  return {fetchImpl,config};
}
async function request(env,path,{token,method="GET",body,headers={}}={}){
  const response=await env.fetchImpl(env.config.url+"/rest/v1/"+path,{
    method,cache:"no-store",redirect:"error",
    // Cloud metadata is optional; stalled connections must not lock the editor.
    signal:globalThis.AbortSignal?.timeout?.(10000),
    headers:{
      apikey:env.config.publishableKey,
      Accept:"application/json",...headers,
      ...(token?{Authorization:"Bearer "+token}:{}),
      ...(body?{"Content-Type":"application/json"}:{})
    },...(body?{body:JSON.stringify(body)}:{})
  });
  if(!response.ok)throw Error("FolkNet metadata HTTP "+response.status);
  if(response.status===204)return [];
  return response.json();
}
/** An unavailable table is optional: preserve the checked-in names. */
export async function loadPublicCourseLabels({fetchImpl=fetch,configLoader=null}={}){
  const env=await setup({fetchImpl,configLoader});
  const data=await request(env,"folk_course_labels?select=kind,key,label&limit=5000");
  if(!Array.isArray(data)||data.length>MAX_ROWS||data.some(row=>!validRow(row)))
    throw Error("Invalid public course-name response");
  return data;
}
/** Never infer admin rights from an email address, user metadata or local storage. */
export async function checkCourseAdmin({fetchImpl=fetch,configLoader=null}={}){
  const account=getFolkAccountSnapshot();
  if(account.status!=="signed-in"||!account.user?.id)return false;
  const token=await getFolkAccessToken();
  const env=await setup({fetchImpl,configLoader});
  const rows=await request(env,"folk_site_admins?select=user_id&user_id=eq."+
    encodeURIComponent(account.user.id)+"&limit=1",{token});
  return Array.isArray(rows)&&rows.length===1&&rows[0]?.user_id===account.user.id;
}
export async function saveCourseLabel(row,{fetchImpl=fetch,configLoader=null}={}){
  if(!validRow(row))throw Error("Invalid course label");
  if(!await checkCourseAdmin({fetchImpl,configLoader}))throw Error("Admin access denied");
  const token=await getFolkAccessToken();
  const env=await setup({fetchImpl,configLoader});
  const saved=await request(env,"folk_course_labels?on_conflict=kind,key",{
    token,method:"POST",body:{kind:row.kind,key:row.key,label:row.label.trim()},
    headers:{Prefer:"resolution=merge-duplicates,return=representation"}});
  if(!Array.isArray(saved)||saved.length!==1)throw Error("Change not confirmed by server");
  return saved[0];
}
export async function deleteCourseLabel({kind,key},{fetchImpl=fetch,configLoader=null}={}){
  if(!validRow({kind,key,label:"Test"}))throw Error("Invalid course label identifier");
  if(!await checkCourseAdmin({fetchImpl,configLoader}))throw Error("Admin access denied");
  const token=await getFolkAccessToken();
  const env=await setup({fetchImpl,configLoader});
  const removed=await request(env,"folk_course_labels?kind=eq."+encodeURIComponent(kind)+
    "&key=eq."+encodeURIComponent(key),{
      token,method:"DELETE",headers:{Prefer:"return=representation"}
    });
  if(!Array.isArray(removed)||removed.length!==1)
    throw Error("No matching course-label override was removed");
  return removed[0];
}
