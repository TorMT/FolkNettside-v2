/** A download attribute filename is untrusted display metadata, not a path. */
export function pythonDownloadFilename(name){
 const base=typeof name==="string"?name.replace(/\\/g,"/").split("/").pop():"";
 const cleaned=(base||"").replace(/[^\p{L}\p{M}\p{N}_.-]+/gu,"_")
   .replace(/^\.+/,"").slice(0,140);
 return cleaned&&/[\p{L}\p{N}]/u.test(cleaned)?cleaned:"script.py";
}
