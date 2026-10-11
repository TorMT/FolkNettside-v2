/**
 * A browser directory picker prefixes every webkitRelativePath with the
 * selected folder name. Pyodide's working directory is the *contents* of that
 * folder, so remove only that common outer folder.
 * Preserve all nested Python packages and data directories.
 */
export function pythonUploadPaths(files,{folder=false}={}){
  if(!Array.isArray(files))throw new Error("Python uploads must be an array");
  if(!folder)return files.map(file=>({file,name:file?.name||""}));
  if(!files.length)return [];
  const prefixes=files.map(file=>{
    const parts=String(file?.webkitRelativePath||"").replace(/\\/g,"/").split("/");
    if(parts.length<2||parts.some(part=>!part||part==="."||part===".."))
      throw new Error("Invalid folder selection path");
    return parts;
  });
  const root=prefixes[0][0];
  if(prefixes.some(parts=>parts[0]!==root))
    throw new Error("Folder upload mixes unrelated roots");
  return files.map((file,index)=>({file,name:prefixes[index].slice(1).join("/")}));
}
