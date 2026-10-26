/**
 * Local browser-only fallback for publicly indexed NTNU files whose normal
 * preview cannot fetch cross-origin content from GitHub Pages.
 * No upload, proxy or external account is involved.
 */
import {extension} from "./utils.js?v=16905756e8ca0c03b44e439a98d4a14270553414";
import {viewerKind} from "./registry.js?v=16905756e8ca0c03b44e439a98d4a14270553414";

const ORIGIN="https://tormt.folk.ntnu.no";
const MAX_SIZE=55*1024*1024;
const KINDS=new Set([
  "python","notebook","text","csv","latex","pdf","office","html",
  "image","stl","three-mf","gltf","obj","cad","fusion","kisssoft",
  "audio","video","archive"
]);
const PRIVATE=/beskyttet|protected|private|privat|restricted|hemmelig|secret|credential|passord|password|token|\.env|\.htaccess/i;

export function canRetryNTNUWithLocalFile(resource){
  if(resource?.remoteArchive!==true||resource?.source!=="ntnu"||
     !KINDS.has(viewerKind(resource))||!extension(resource.name||""))return false;
  try{
    const u=new URL(resource.url);
    if(u.origin!==ORIGIN||u.href!==resource.url||u.username||u.password||
       u.search||u.hash||u.protocol!=="https:")return false;
    const parts=u.pathname.slice(1).split("/").map(s=>decodeURIComponent(s));
    if(parts.length<5||parts[0]!=="semestre"||
       !/^(?:[1-9]|1\d|20)$/.test(parts[1])||
       !["filer","quiz"].includes(parts[3]))return false;
    if(parts.some(s=>!s||s==="."||s===".."||s.startsWith(".")||
      s.startsWith("~$")||PRIVATE.test(s)||/[\/\\%?#\u0000-\u001f\u007f]/.test(s)))
      return false;
    return parts.at(-1)===resource.name;
  }catch{return false}
}

export function createNTNULocalPreview(resource,file,{makeURL=URL.createObjectURL}={}){
  if(!canRetryNTNUWithLocalFile(resource))throw Error("Unapproved NTNU preview");
  if(!file||typeof file.name!=="string"||!Number.isSafeInteger(file.size)||
     file.size<0||file.size>MAX_SIZE)
    throw Error("Local file is missing or exceeds 55 MiB");
  if(extension(file.name)!==extension(resource.name))
    throw Error("Choose a file with the same extension as the NTNU resource");
  const path=makeURL(file);
  if(typeof path!=="string"||!path.startsWith("blob:"))
    throw Error("Local browser preview URL unavailable");
  return {...resource,path,localPreview:true,remoteArchive:false};
}
