import {getJSZip} from "../../vendor/jszip.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";

/** Native Fusion archives are packages, not triangulated CAD meshes.
 * This inspector reads ZIP entry names and original embedded preview images.
 * It never decodes proprietary B-rep data or treats a thumbnail as geometry.
 */
export const FUSION_MAX_BYTES=55*1024*1024;
const INNER_MAX_BYTES=38*1024*1024;
const PREVIEW_MAX_BYTES=4*1024*1024;
const MAX_ENTRIES=2200;
const MAX_DOCUMENTS=20;
const GEOMETRY=/\.(?:3mf|stl|step|stp|iges|igs|brep)$/i;
const IMAGE=/\.(?:png|jpg|jpeg|webp)$/i;
const F3D=/\.f3d$/i;
const PREVIEW=/(?:^|\/)(?:previews?|thumbnail|thumbs|screenshots?|snapshots?)(?:\/|$)|(?:^|\/)(?:small|medium|large|preview|thumbnail)\.(?:png|jpg|jpeg|webp)$/i;
const readableName=value=>String(value||"").replace(/[\u0000-\u001f]/g,"").slice(0,240);
function validZip(buffer){
 const bytes=new Uint8Array(buffer,0,Math.min(buffer.byteLength,4));
 return bytes[0]===80&&bytes[1]===75&&
   ((bytes[2]===3&&bytes[3]===4)||(bytes[2]===5&&bytes[3]===6));
}
export function previewCandidates(paths=[]){
 return [...paths].filter(path=>IMAGE.test(path)&&PREVIEW.test(path))
   .sort((a,b)=>{
     const score=path=>{
       const value=String(path).toLowerCase();
       return (/\/large\.(png|jpe?g|webp)$/.test(value)?0:
         /\/medium\.(png|jpe?g|webp)$/.test(value)?1:
         /\/small\.(png|jpe?g|webp)$/.test(value)?2:3);
     };
     return score(a)-score(b)||a.localeCompare(b);
   });
}
export function describeFusionPackagePaths(paths=[]){
 const items=paths.filter(path=>path&&!path.endsWith("/"));
 return {entries:items.length,
   designs:items.filter(path=>F3D.test(path)),
   neutral:items.filter(path=>GEOMETRY.test(path)),
   previewCandidates:previewCandidates(items)
 };
}
function validateArchiveEntries(zip){
 const entries=Object.values(zip.files).filter(entry=>!entry.dir);
 if(entries.length>MAX_ENTRIES)throw Error("Fusion archive contains too many entries for safe preview");
 for(const item of entries){
   const reported=Number(item._data?.uncompressedSize||0);
   if(!Number.isFinite(reported)||reported<0||reported>INNER_MAX_BYTES)
     throw Error("Oversized entry in Fusion archive");
 }
 return entries;
}
async function zipFromBytes(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength>FUSION_MAX_BYTES||!buffer.byteLength)
   throw Error("Fusion archive must be between 1 byte and 55 MiB");
 if(!validZip(buffer))throw Error("This Fusion archive is not a readable ZIP package");
 const JSZip=await getJSZip();
 const zip=await JSZip.loadAsync(buffer);
 validateArchiveEntries(zip);
 return zip;
}
function imageMime(data){
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>data[i]===n))return "image/png";
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return "image/jpeg";
 if(data.length>=12&&String.fromCharCode(...data.subarray(0,4))==="RIFF"&&
   String.fromCharCode(...data.subarray(8,12))==="WEBP")return "image/webp";
 return null;
}
async function readPreview(zip,paths){
 for(const path of previewCandidates(paths)){
   const entry=zip.file(path);if(!entry)continue;
   if(Number(entry._data?.uncompressedSize||0)>PREVIEW_MAX_BYTES)continue;
   try{
     const data=await entry.async("uint8array");
     if(data.length>PREVIEW_MAX_BYTES)continue;
     const mime=imageMime(data);
     if(mime)return {path:readableName(path),mime,data};
   }catch{ /* Try the next candidate; thumbnail may be corrupt. */ }
 }
 return null;
}
/** Read main archive and the original nested F3D document previews.
 * Decompression is bounded and no ZIP streams are executed or extracted to disk.
 */
export async function inspectFusionPackage(buffer,name="Fusion archive"){
 const extension=String(name).split(".").pop().toLowerCase();
 if(extension!=="f3d"&&extension!=="f3z")
   throw Error("Fusion inspector accepts only F3D/F3Z archives");
 const archive=await zipFromBytes(buffer);
 const paths=Object.keys(archive.files).filter(path=>!archive.files[path].dir);
 const summary=describeFusionPackagePaths(paths);
 const documents=[];
 if(extension==="f3d"){
   documents.push({path:readableName(name),kind:"F3D",entries:summary.entries,
     neutral:summary.neutral.map(readableName),preview:await readPreview(archive,paths)});
 }else{
   for(const path of summary.designs.slice(0,MAX_DOCUMENTS)){
     const entry=archive.file(path);
     if(!entry)continue;
     let document;
     const size=Number(entry._data?.uncompressedSize||0);
     if(size>INNER_MAX_BYTES){
       document={path:readableName(path),kind:"F3D",error:"Embedded design exceeds safe preview size"};
     }else{
       try{
         const bytes=await entry.async("arraybuffer");
         if(bytes.byteLength>INNER_MAX_BYTES)throw Error("Embedded design exceeds safe preview size");
         const nested=await zipFromBytes(bytes);
         const nestedPaths=Object.keys(nested.files).filter(key=>!nested.files[key].dir);
         const summaryNested=describeFusionPackagePaths(nestedPaths);
         document={path:readableName(path),kind:"F3D",entries:summaryNested.entries,
           neutral:summaryNested.neutral.map(readableName),
           preview:await readPreview(nested,nestedPaths)};
       }catch(error){
         document={path:readableName(path),kind:"F3D",
           error:String(error.message||error).slice(0,230)};
       }
     }
     documents.push(document);
   }
 }
 return {name:readableName(name),format:extension.toUpperCase(),
   entries:summary.entries,neutral:summary.neutral.map(readableName),
   designsTotal:summary.designs.length,documents,preview:await readPreview(archive,paths)};
}
