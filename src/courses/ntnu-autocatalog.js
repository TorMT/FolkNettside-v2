/**
 * Opt-in V2 public catalog, produced locally from reviewed NTNU folders.
 * Never substitutes GitHub fixtures for actual NTNU courses.
 * Invalid/unavailable auto-index -> existing per-semester public JSON indexes.
 */
import {NTNU_ORIGIN,parseNTNUSemesterIndex,loadNTNUCatalog,readBoundedIndexBody,
  isSafeNTNUSegment,NTNU_INDEX_TIMEOUT_MS,withNTNUIndexDeadline} from "./ntnu-catalog.js?v=d0d5d42501a65af993688ac13345f9fcdc28162c";

const MAX_FILES=25_000;
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
// One shared private/credential-name guard for both generated and legacy paths.
const safeSlug=isSafeNTNUSegment;
const expectedPath=(id,slug,relative)=>{
 if(typeof relative!=="string"||relative.length>1400)return null;
 const parts=relative.split("/");
 if(parts.length<2||!["filer","quiz"].includes(parts[0])||
    parts.some(x=>!safeSlug(x)))return null;
 return "/semestre/"+id+"/"+encodeURIComponent(slug)+"/"+
   parts.map(encodeURIComponent).join("/");
};

/** Re-normalize all incoming paths through the legacy NTNU safety parser. */
export function validateNTNUAutoCatalog(raw,{origin=NTNU_ORIGIN}={}){
 if(origin!==NTNU_ORIGIN||!object(raw)||raw.schemaVersion!==2||
    raw.source!=="ntnu-auto-preview"||!Array.isArray(raw.semesters)||
    raw.semesters.length<1||raw.semesters.length>20)
   throw Error("Unrecognized auto-index schema or origin");
 const ids=new Set(),semesters=[];
 let total=0;
 for(const semester of raw.semesters){
   const id=semester?.id;
   if(!Number.isInteger(id)||id<1||id>20||ids.has(id)||
       !Array.isArray(semester.courses)||semester.courses.length>500)
     throw Error("Invalid auto-index semester");
   ids.add(id);
   const records=Object.create(null),titles=new Map(),sizes=new Map();
   for(const course of semester.courses){
     const slug=course?.code;
     if(!safeSlug(slug)||Object.hasOwn(records,slug)||
       course.semester!==id||!Array.isArray(course.resources)||
       course.resources.length>MAX_FILES||
       typeof course.title!=="string"||!course.title.trim()||
       course.title.length>130)
       throw Error("Invalid auto-index course");
     const seen=new Set(),files=[];
     for(const file of course.resources){
       total++;
       if(total>MAX_FILES||!object(file))throw Error("Auto-index resource limit");
       const relative=file.relativePath;
       const path=expectedPath(id,slug,relative);
       if(!path||file.path!==path||file.url!==origin+path||
          file.source!=="ntnu"||seen.has(relative))
         throw Error("Unsafe or duplicate auto-index path");
       seen.add(relative);
       if(!Number.isSafeInteger(file.size)||file.size<0||
          !Number.isSafeInteger(file.modified)||file.modified<0)
         throw Error("Invalid public resource metadata");
       files.push(relative);
       sizes.set(id+":"+slug+":"+relative,{size:file.size,modified:file.modified});
     }
     records[slug]={dir:slug,beskyttet:false,files};
     titles.set(id+":"+slug,course.title.trim());
   }
   const checked=parseNTNUSemesterIndex(id,records,{origin,titles});
   if(checked.courses.length!==semester.courses.length)
     throw Error("Unsafe auto-index course was dropped");
   for(const course of checked.courses){
     const source=records[course.code];
     if(course.resources.length!==source.files.length)
       throw Error("Unsafe auto-index resource was dropped");
     course.resources=course.resources.map(item=>({
       ...item,...sizes.get(id+":"+course.code+":"+item.relativePath)
     }));
   }
   semesters.push(checked);
 }
 semesters.sort((a,b)=>a.id-b.id);
 return {schemaVersion:2,source:"ntnu-auto-validated",
   semesters,status:"auto",failedSemesters:[]};
}

export async function loadNTNUAutoCatalog({
 fetchImpl=fetch,origin=NTNU_ORIGIN,timeoutMs=NTNU_INDEX_TIMEOUT_MS
}={}){
 if(origin!==NTNU_ORIGIN)throw Error("Unexpected NTNU origin");
 // Relative to the V2 app directory, never the existing V1 semester root.
 return withNTNUIndexDeadline(async signal=>{
   const response=await fetchImpl("./data/ntnu-autocatalog.json",{
     cache:"no-store",credentials:"same-origin",mode:"same-origin",
     redirect:"error",signal,headers:{Accept:"application/json"}
   });
   if(!response.ok)throw Error("Auto-index unavailable HTTP "+response.status);
   const content=await readBoundedIndexBody(response);
   let parsed;
   try{parsed=JSON.parse(content)}catch{throw Error("Auto-index invalid JSON")}
   return validateNTNUAutoCatalog(parsed,{origin});
 },timeoutMs);
}

/** Missing/invalid V2 catalog never prevents use of the existing V1 indexes. */
export async function loadPreferredNTNUCatalog({
 fetchImpl=fetch,origin=NTNU_ORIGIN,navbarHtml="",timeoutMs=NTNU_INDEX_TIMEOUT_MS
}={}){
 try{
   const manifest=await loadNTNUAutoCatalog({fetchImpl,origin,timeoutMs});
   return {manifest,source:"auto",fallback:false};
 }catch(error){
   // Protect against accidental cross-origin use, not a recoverable error.
   if(origin!==NTNU_ORIGIN)throw error;
   const manifest=await loadNTNUCatalog({fetchImpl,origin,navbarHtml,timeoutMs});
   return {manifest,source:"legacy",fallback:true};
 }
}
