#!/usr/bin/env node
/**
 * Opt-in, read-only HEAD audit of a bounded sample of *reviewed public*
 * NTNU file references. No course file content is downloaded or uploaded.
 * HEAD support is server-specific; 401/403/405/redirects are inconclusive
 * about whether a real browser can open the file. Never emit file URLs.
 */
import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";

const MAX_SAMPLE=40;
const MAX_MS=10000;
const formatGroup=kind=>{
  if(["PDF","PY","IPYNB"].includes(kind))return kind;
  if(["DOCX","XLSX","PPTX","DOC","XLS","PPT"].includes(kind))return "OFFICE";
  if(["F3Z","F3D","STEP","STL","3MF","GLB","GLTF","OBJ"].includes(kind))return "CAD";
  if(["IMAGE","VIDEO","AUDIO"].includes(kind))return "MEDIA";
  return "OTHER";
};

/**
 * Each resource has already been revalidated against the fixed HTTPS NTNU
 * origin, approved 'filer'/'quiz' path structure and private-name exclusions.
 * Take a balanced deterministic sample across semester, type and nesting.
 */
export function selectNTNUPublicHeaderSample(catalog,{limit=24}={}){
  if(!Number.isInteger(limit)||limit<1||limit>MAX_SAMPLE)
    throw Error("HEAD sample limit must be between 1 and 40");
  const checked=validateNTNUAutoCatalog(catalog);
  const buckets=new Map();
  for(const semester of checked.semesters){
    for(const course of semester.courses){
      for(const file of course.resources){
        const format=formatGroup(file.kind);
        const nested=(file.relativePath.split("/").length>2);
        const key=[semester.id,format,nested?"nested":"flat"].join(":");
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key).push({
          semester:semester.id,format,nested,url:file.url
        });
      }
    }
  }
  const groups=[...buckets.values()],sample=[];
  let depth=0;
  while(sample.length<limit){
    let taken=false;
    for(const files of groups){
      if(files.length>depth){
        sample.push(files[depth]);
        taken=true;
        if(sample.length===limit)break;
      }
    }
    if(!taken)break;
    depth++;
  }
  return sample;
}

function stateForStatus(status){
 if(Number.isInteger(status)&&status>=200&&status<300)return "responded";
 if(status===404||status===410)return "notFound";
 if(status===401||status===403)return "accessRestricted";
 if(status===405||status===501)return "headUnsupported";
 return "unverified";
}

/** All requests are HEAD-only, with redirects disabled and a short deadline. */
export async function auditNTNUPublicHeaders(catalog,{
  fetchImpl=fetch,limit=24
}={}){
 const sample=selectNTNUPublicHeaderSample(catalog,{limit});
 const counts={responded:0,notFound:0,accessRestricted:0,
   headUnsupported:0,unverified:0};
 const byFormat={};
 const bySemester={};
 for(const entry of sample){
   let state="unverified";
   try{
     const response=await fetchImpl(entry.url,{
       method:"HEAD",redirect:"error",credentials:"omit",
       cache:"no-store",referrerPolicy:"no-referrer",
       signal:AbortSignal.timeout(MAX_MS)
     });
     if(!response.url||response.url===entry.url)
       state=stateForStatus(response.status);
   }catch{
     // Do not expose opaque network errors or unreviewed redirected URLs.
   }
   counts[state]++;
   byFormat[entry.format]??={checked:0,responded:0};
   byFormat[entry.format].checked++;
   if(state==="responded")byFormat[entry.format].responded++;
   bySemester[entry.semester]??={checked:0,responded:0};
   bySemester[entry.semester].checked++;
   if(state==="responded")bySemester[entry.semester].responded++;
 }
 return {
   source:"Reviewed public NTNU auto-catalog",
   readOnly:true,method:"HEAD",selected:sample.length,
   counts,bySemester,byFormat,
   limits:[
     "Only a bounded sample from previously reviewed public catalog entries was requested.",
     "No course file bytes or private/unknown directory indexes were requested.",
     "HEAD status does not prove in-browser preview, CORS, file integrity or authorization of direct URLs.",
     "HEAD-denied/unsupported or network errors remain unverified, not automatically broken."
   ]
 };
}

async function main(){
 if(!process.argv.includes("--live")){
   console.log("Read-only HEAD-only NTNU sample audit. Run: node scripts/audit_ntnu_file_headers.mjs --live");
   return;
 }
 const raw=JSON.parse(await readFile(
   new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
 const report=await auditNTNUPublicHeaders(raw);
 console.log(JSON.stringify(report,null,2));
 if(report.counts.notFound>0)process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await main()}catch(error){
   // Never log metadata, response payload or filenames from unsafe input.
   console.error("Public NTNU HEAD audit stopped:",error instanceof SyntaxError?
     "Invalid local catalog JSON":String(error?.message||"Validation failure").slice(0,120));
   process.exitCode=2;
 }
}
