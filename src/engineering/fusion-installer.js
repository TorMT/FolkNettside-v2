import {getJSZip} from "../vendor/jszip.js?v=6b7381dcbab4670e27848d87c263d50b106c2935";

export const FUSION_SCRIPT_FOLDER="FolkNetFusion";
export const FUSION_MANIFEST=Object.freeze({
  autodeskProduct:"Fusion360",
  type:"script",
  author:"FolkNet",
  description:"Read-only STEP and SI property export for FolkNet CAD",
  version:"1.0.0",
  runOnStartup:false,
  supportedOS:"windows|mac"
});

export function validateFusionScriptSource(source){
 if(typeof source!=="string"||source.length<200||source.length>250_000||
    !source.includes("import adsk.fusion")||
    !source.includes("def run(context):")||
    !source.includes("folknet-fusion.json"))
   throw Error("Downloaded Fusion script does not match the expected source");
 return source;
}

/** Prepares a standard Fusion script directory without executing CAD code in the browser. */
export async function buildFusionScriptPackage(source,{Zip=null}={}){
 validateFusionScriptSource(source);
 const Constructor=Zip||await getJSZip();
 const archive=new Constructor();
 archive.file(FUSION_SCRIPT_FOLDER+"/"+FUSION_SCRIPT_FOLDER+".py",source);
 archive.file(FUSION_SCRIPT_FOLDER+"/"+FUSION_SCRIPT_FOLDER+".manifest",
   JSON.stringify(FUSION_MANIFEST,null,2)+"\n");
 archive.file("README.txt",
  "FolkNet Fusion script — local export, no APS required.\n"+
  "Unzip the FolkNetFusion folder. In Autodesk Fusion, open Utilities > "+
  "Scripts and Add-ins, choose Add (+), select the FolkNetFusion script "+
  "folder, and Run.\n"+
  "The script writes STEP + metadata into Documents/FolkNet_Fusion_Exports.\n"+
  "Upload the resulting ZIP in FolkNet Engineering > CAD.\n"+
  "Keep the original .f3z file untouched.\n");
 return archive.generateAsync({type:"blob",compression:"DEFLATE"});
}

/** Requires a real click; never downloads or executes anything on page load. */
export async function downloadFusionScriptPackage({
 fetchImpl=fetch,sourceURL="./scripts/fusion_export_folknet.py",
 Zip=null,documentImpl=document,URLImpl=URL
}={}){
 const u=new URL(sourceURL,documentImpl.baseURI);
 if(u.origin!==new URL(documentImpl.baseURI).origin||
    !u.pathname.endsWith("/scripts/fusion_export_folknet.py")||
    u.username||u.password||u.search||u.hash)
   throw Error("Unexpected Fusion script URL");
 const response=await fetchImpl(u.toString(),{cache:"no-store",redirect:"error"});
 if(!response.ok)throw Error("Could not load the Fusion script (HTTP "+response.status+")");
 const source=await response.text();
 const blob=await buildFusionScriptPackage(source,{Zip});
 const url=URLImpl.createObjectURL(blob);
 try{
   const link=documentImpl.createElement("a");
   link.href=url;link.download="FolkNetFusion-script.zip";
   documentImpl.body.append(link);
   link.click();link.remove();
 }finally{
   URLImpl.revokeObjectURL(url);
 }
 return "FolkNetFusion-script.zip";
}
