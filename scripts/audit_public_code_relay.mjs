/**
 * Opt-in live verification of the *already approved* read-only NTNU code relay.
 * No course bytes, filenames, body excerpts, tokens or credentials are logged.
 * Run: node scripts/audit_public_code_relay.mjs --live
 */
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const ENDPOINT="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-public-code";
const ORIGIN="https://tormt.github.io";
const SAMPLE_PATHS=Object.freeze([
 "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/input.txt",
 "/semestre/1/itgk/filer/%C3%98ving1/Intro%20til%20jupyter.ipynb"
]);
const DENIED_PATH="/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/not-approved.py";
const url=path=>ENDPOINT+"?path="+encodeURIComponent(path);
const close=response=>{
 // Cancellation is best effort: awaiting a tee'd Response.clone() cancel can
 // remain unresolved until every other branch is consumed (Node test doubles).
 try{void response.body?.cancel?.()?.catch?.(()=>{})}catch{}
};
const timeout=()=>AbortSignal.timeout(20000);

/** Caller supplies fetch to keep the default CI entirely offline. */
export async function auditPublicCodeRelay({fetchImpl=fetch}={}){
 let success=0;
 for(const path of SAMPLE_PATHS){
   const response=await fetchImpl(url(path),{
     method:"GET",redirect:"error",signal:timeout(),headers:{Origin:ORIGIN}
   });
   try{
     if(response.status!==200||response.redirected||
        response.headers.get("access-control-allow-origin")!==ORIGIN||
        !/^text\/plain\b/i.test(response.headers.get("content-type")||""))
       throw Error("Approved public source GET/CORS check failed");
     success++;
   }finally{close(response)}
 }
 const denied=await fetchImpl(url(DENIED_PATH),{
   method:"GET",redirect:"error",signal:timeout(),headers:{Origin:ORIGIN}
 });
 try{
   if(denied.status!==404||
      denied.headers.get("access-control-allow-origin")!==ORIGIN)
     throw Error("Unapproved path denial/CORS check failed");
 }finally{close(denied)}
 const forbidden=await fetchImpl(url(SAMPLE_PATHS[0]),{
   method:"GET",redirect:"error",signal:timeout(),
   headers:{Origin:"https://not-an-approved-origin.example"}
 });
 try{
   if(forbidden.status!==403||forbidden.headers.get("access-control-allow-origin"))
     throw Error("Unapproved origin denial check failed");
 }finally{close(forbidden)}
 return {approvedGET:success,deniedPath:true,deniedOrigin:true};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 if(process.argv.length!==3||process.argv[2]!=="--live"){
   console.error("Opt-in only: node scripts/audit_public_code_relay.mjs --live");
   process.exitCode=2;
 }else{
   auditPublicCodeRelay().then(report=>{
     console.log("PASS: "+report.approvedGET+" public source GET/CORS checks, "+
       "unapproved path and unapproved origin denied");
   }).catch(error=>{
     // Never include request URLs or upstream response bodies in logs.
     console.error("FAIL: public relay validation did not meet expected status/CORS checks");
     process.exitCode=1;
   });
 }
}
