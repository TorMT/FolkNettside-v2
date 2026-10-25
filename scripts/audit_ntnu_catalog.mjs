#!/usr/bin/env node
/**
 * READ-ONLY health summary of the EXISTING public NTNU JSON indexes.
 * No files are downloaded, no private paths or filenames appear in output.
 * Running without --live prints instructions and makes no network requests.
 */
import {parseNTNUSemesterIndex,NTNU_ORIGIN} from "../src/courses/ntnu-catalog.js";
import {viewerKind} from "../src/viewers/registry.js";

const valid=raw=>raw!==null&&typeof raw==="object"&&!Array.isArray(raw);
export function summarizeSemester(id,source){
 if(!Number.isInteger(Number(id))||!valid(source))throw Error("Invalid semester data");
 const catalog=parseNTNUSemesterIndex(id,source);
 let sourceCount=0,privateDirectories=0,unclassifiedDirectories=0,excludedCourses=0;
 for(const [slug,record] of Object.entries(source)){
  if(slug==="welcome"||!valid(record))continue;
  if(record.beskyttet===true||/beskyttet|private|privat|protected|secret/i.test(slug)){
    privateDirectories++;
    continue; // do not touch or count protected file metadata
  }
  // The live and generated public catalogs require explicit false.
  // Unknown access is never included in public metrics or file counts.
  if(record.beskyttet!==false){unclassifiedDirectories++;continue}
  const indexed=Array.isArray(record.files)?record.files:[];
  sourceCount+=indexed.length;
  // This V1 quiz is a separately indexed resource, not in files[].
  if(typeof record.quiz==="string"&&!indexed.includes(record.quiz))sourceCount++;
  if(!catalog.courses.some(x=>x.code===slug))excludedCourses++;
 }
 const resources=catalog.courses.flatMap(c=>c.resources);
 const formats=Object.create(null);
 let nestedPaths=0,unsupported=0;
 for(const item of resources){
  const kind=viewerKind(item);
  formats[kind]=(formats[kind]||0)+1;
  if((item.folders||[]).length)nestedPaths++;
  if(kind==="unsupported"||kind==="conversion")unsupported++;
 }
 return {
  semester:Number(id),courses:catalog.courses.length,
  // only aggregate counts, never filenames, URLs, credential-like strings
  publicIndexEntries:sourceCount,
  visibleResources:resources.length,
  skippedEntries:Math.max(0,sourceCount-resources.length),
  excludedCourses,protectedCourseDirectories:privateDirectories,
  unclassifiedCourseDirectories:unclassifiedDirectories,
  nestedFiles:nestedPaths,withoutNativePreview:unsupported,
  viewerFormats:Object.fromEntries(Object.entries(formats).sort())
 };
}
export function summarizeRoot(root,details){
 if(!valid(root)||!valid(details))throw Error("Expected public NTNU JSON indexes");
 const ids=Object.keys(root).filter(id=>/^\d{1,2}$/.test(id)&&
    Number(id)>=1&&Number(id)<=20&&root[id]?.beskyttet===false)
  .map(Number).sort((a,b)=>a-b);
 const semesters=ids.map(id=>{
  const raw=details[id];
  return valid(raw)?summarizeSemester(id,raw):
    {semester:id,unavailable:true};
 });
 const available=semesters.filter(s=>!s.unavailable);
 return {
  source:"NTNU public JSON index metadata only",readOnly:true,
  semesterCount:ids.length,
  availableSemesters:available.length,
  visibleCourses:available.reduce((a,s)=>a+s.courses,0),
  visibleResources:available.reduce((a,s)=>a+s.visibleResources,0),
  skippedEntries:available.reduce((a,s)=>a+s.skippedEntries,0),
  nonPreviewable:available.reduce((a,s)=>a+s.withoutNativePreview,0),
  semesters
 };
}
async function getJSON(path){
 const u=new URL(path,NTNU_ORIGIN);
 if(u.origin!==NTNU_ORIGIN||!/^\/semestre\/(?:index\.json|\d{1,2}\/index\.json)$/.test(u.pathname))
  throw Error("Unapproved URL");
 const response=await fetch(u,{cache:"no-store",redirect:"error",
   signal:AbortSignal.timeout(15000),headers:{Accept:"application/json"}});
 if(!response.ok)throw Error("Public index HTTP "+response.status);
 if(Number(response.headers.get("content-length"))>4_000_000)
  throw Error("Public index too large");
 const text=await response.text();
 if(text.length>4_000_000)throw Error("Public index too large");
 return JSON.parse(text);
}
export async function liveAudit(){
 const root=await getJSON("/semestre/index.json"),details={};
 const ids=Object.keys(root).filter(x=>/^\d{1,2}$/.test(x)&&
   Number(x)<=20&&Number(x)>=1&&root[x]?.beskyttet!==true);
 // Never request individual PDFs, private courses or material downloads.
 const results=await Promise.allSettled(ids.map(async id=>getJSON(
  "/semestre/"+Number(id)+"/index.json"
 )));
 results.forEach((r,i)=>{if(r.status==="fulfilled")details[ids[i]]=r.value});
 return summarizeRoot(root,details);
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 if(!process.argv.includes("--live")){
   console.log("Read-only public metadata audit. Run: node scripts/audit_ntnu_catalog.mjs --live");
 }else{
   try{
     const report=await liveAudit();
     console.log(JSON.stringify(report,null,2));
     if(report.availableSemesters!==report.semesterCount)process.exitCode=1;
   }catch(error){
     console.error("Unable to audit NTNU public indexes:",String(error?.message||error));
     process.exitCode=1;
   }
 }
}
