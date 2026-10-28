/* Dedicated, disposable Pyodide Web Worker.
 * This isolates long-running computation from the UI thread, but is NOT a
 * security boundary for untrusted Python (Pyodide can access JS APIs).
 * Nothing runs until the user explicitly selects Run.
 */
const PYODIDE_VERSION="0.27.7";
const PYODIDE_BASE="https://cdn.jsdelivr.net/pyodide/v"+PYODIDE_VERSION+"/full/";
let runtime=null,bootstrap=null;
const WORKSPACE="/home/pyodide/workspace";
const uploadedFiles=new Set();
const fetchedFiles=new Set();
const missingFiles=new Set();
let sourceBase=null, usePublicRelay=false, fetchAttempts=0, activeRunId=null;
const NTNU_SOURCE_ORIGIN="https://tormt.folk.ntnu.no";
const PUBLIC_CODE_RELAY="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-public-code";
const send=(message)=>self.postMessage(message);

// Browser-native synchronous file resolution is permitted in dedicated Workers.
// Never resolve outside the original script's own folder or across origins.
// A failed lookup is cached, limiting the overhead of absent modules.
function setSourceBase(url,siblingRelayURL=""){
  sourceBase=null;usePublicRelay=false;
  if(!url)return;
  try{
    const target=new URL(url,self.location.href);
    if(!["https:","http:"].includes(target.protocol)||
       target.username||target.password)return;
    // Keep same-origin cache-busting query/fragment URLs working. Only the
    // cross-origin NTNU relay requires a canonical URL without either.
    if(target.origin===self.location.origin){
      sourceBase=new URL(".",target);
      return;
    }
    // GitHub Pages can read only specifically approved public NTNU files
    // through the read-only Edge relay. The relay enforces the allowlist.
    if(target.search||target.hash||target.origin!==NTNU_SOURCE_ORIGIN||
       siblingRelayURL!==PUBLIC_CODE_RELAY+"?path="+encodeURIComponent(target.pathname))return;
    sourceBase=new URL(".",target);
    usePublicRelay=true;
  }catch{sourceBase=null;usePublicRelay=false}
}

// Filenames from NTNU can contain Æ/Ø/Å or other Unicode letters. They
// must remain round-trip safe while rejecting traversal, hidden paths,
// embedded escapes, control characters and URL syntax.
function safeSiblingRelativePath(relative){
  if(typeof relative!=="string"||relative.length>300)return null;
  const path=relative.replace(/\\/g,"/");
  const parts=path.split("/");
  if(!parts.length||parts.length>12||
     parts.some(part=>!part||part==="."||part===".."||part.startsWith(".")||
       part.length>140||!/^[\p{L}\p{M}\p{N}_() +.\-]+$/u.test(part)))
    return null;
  return path;
}
function loadSiblingFile(relative){
  if(!sourceBase||fetchAttempts>=100)return false;
  const path=safeSiblingRelativePath(relative);
  if(!path)return false;
  const parts=path.split("/");
  if(missingFiles.has(path))return false;
  if(uploadedFiles.has(path)||fetchedFiles.has(path))return true;
  try{
    const url=new URL(parts.map(encodeURIComponent).join("/"),sourceBase);
    if(url.origin!==sourceBase.origin||!url.pathname.startsWith(sourceBase.pathname))
      return false;
    fetchAttempts++;
    const xhr=new XMLHttpRequest();
    xhr.open("GET",usePublicRelay
      ?PUBLIC_CODE_RELAY+"?path="+encodeURIComponent(url.pathname)
      :url.href,false);
    xhr.responseType="arraybuffer";
    xhr.send();
    if(xhr.status!==200||!xhr.response||xhr.response.byteLength>8_000_000)
      throw new Error("not found or over 8 MB");
    if(xhr.response.byteLength===0)throw new Error("empty file");
    const py=runtime;
    const destination=WORKSPACE+"/"+path;
    if(parts.length>1)py.FS.mkdirTree(WORKSPACE+"/"+parts.slice(0,-1).join("/"));
    py.FS.writeFile(destination,new Uint8Array(xhr.response));
    fetchedFiles.add(path);
    return true;
  }catch{missingFiles.add(path);return false}
}
self._viewerFetchSibling=loadSiblingFile;
self._viewerEmitImage=src=>{
  if(activeRunId!==null)send({id:activeRunId,phase:"output",output:{type:"image",src}});
};
async function ensurePython(){
  if(runtime)return runtime;
  if(!bootstrap)bootstrap=(async()=>{
    importScripts(PYODIDE_BASE+"pyodide.js");
    const loaded=await self.loadPyodide({indexURL:PYODIDE_BASE});
    loaded.FS.mkdirTree(WORKSPACE);
    loaded.runPython('import os; os.chdir("/home/pyodide/workspace")');
    // Runtime helper installs local import/pathlib shims and an inline
    // matplotlib renderer. It is local static code, not an external library.
    const response=await fetch(new URL("./python-runtime-init.py",self.location.href));
    if(!response.ok)throw new Error("Python viewer initialization HTTP "+response.status);
    loaded.globals.set("_viewer_fetch_file",path=>loadSiblingFile(String(path)));
    loaded.globals.set("_viewer_emit_image",src=>self._viewerEmitImage(String(src)));
    runtime=loaded;
    loaded.runPython(await response.text());
    return loaded;
  })();
  try{runtime=await bootstrap;return runtime}
  catch(error){bootstrap=null;throw error}
}
function safeName(name){
  const value=String(name||"").replace(/\\/g,"/");
  const base=value.split("/").pop();
  if(!base||base==="."||base===".."||!/[\p{L}\p{N}]/u.test(base))
    throw new Error("Invalid Python workspace filename");
  // Keep the original Norwegian/Unicode course filename in Python's __file__;
  // Pyodide's virtual FS already accepts these characters in mounted paths.
  return base.replace(/[^\p{L}\p{M}\p{N}_.() +\-]/gu,"_").slice(0,140);
}
function safeMountPath(name){
  const value=String(name||"").replace(/\\/g,"/");
  const segments=value.split("/");
  if(!segments.length||segments.length>12||value.length>500||
     segments.some(part=>!part||part==="."||part===".."||
       part.startsWith(".")||!/[\p{L}\p{N}]/u.test(part)))
    throw new Error("Invalid Python workspace path");
  return segments.map(part=>part.replace(/[^\p{L}\p{M}\p{N}_.() +\-]/gu,"_").slice(0,140)).join("/");
}
function prepareMountFiles(files){
  if(!Array.isArray(files)||files.length>40)
    throw new Error("Choose at most 40 local files");
  const pending=[],names=new Set();
  let total=0;
  for(const file of files){
    const name=safeMountPath(file?.name);
    if(names.has(name))throw new Error("Duplicate Python workspace path: "+name);
    names.add(name);
    const bytes=file?.data instanceof Uint8Array?file.data:new Uint8Array(file?.data||0);
    total+=bytes.length;
    if(bytes.length>8_000_000||total>25_000_000)
      throw new Error("Input files exceed the 8 MB per-file / 25 MB total limit");
    pending.push({name,bytes});
  }
  return pending;
}
async function mountFiles(files){
  // Validate the whole batch before mutating the Python filesystem.
  const pending=prepareMountFiles(files);
  const py=await ensurePython();
  for(const {name,bytes} of pending){
    if(name.includes("/"))py.FS.mkdirTree(WORKSPACE+"/"+name.slice(0,name.lastIndexOf("/")));
    py.FS.writeFile(WORKSPACE+"/"+name,bytes);
    uploadedFiles.add(name);
  }
  return {mounted:pending.length,filenames:[...uploadedFiles]};
}
function generatedFiles(py){
  const outputs=[],stack=[{path:"",depth:0}];
  let visited=0;
  while(stack.length&&outputs.length<15&&visited<500){
    const current=stack.pop();
    let names;
    try{names=py.FS.readdir(WORKSPACE+(current.path?"/"+current.path:""))}catch{continue}
    for(const name of names){
      if(outputs.length>=15||visited>=500)break;
      if(name==="."||name===".."||name==="__pycache__"||name.startsWith("."))continue;
      visited++;
      const relative=current.path?current.path+"/"+name:name;
      const path=WORKSPACE+"/"+relative;
      let stat;
      try{stat=py.FS.stat(path)}catch{continue}
      if(py.FS.isDir(stat.mode)){
        if(current.depth<7)stack.push({path:relative,depth:current.depth+1});
        continue;
      }
      if(uploadedFiles.has(relative)||fetchedFiles.has(relative))continue;
      if(!py.FS.isFile(stat.mode)||stat.size>4_000_000||stat.size<1)continue;
      outputs.push({name:relative,bytes:py.FS.readFile(path)});
    }
  }
  return outputs;
}
async function run(code,stdin="",sourceURL="",siblingRelayURL=""){
  const py=await ensurePython();
  if(typeof code!=="string"||code.length>500000)
    throw new Error("Python source must be text under 500 KB");
  setSourceBase(sourceURL,siblingRelayURL);
  // Provide a real __file__ path so Path(__file__).parent works in local
  // course scripts, including those loading sibling CSV/JSON dependencies.
  let scriptName="scratch.py";
  if(sourceBase&&sourceURL){
    try{scriptName=safeName(decodeURIComponent(
      new URL(sourceURL,self.location.href).pathname.split("/").pop()))}
    catch{scriptName="script.py"}
  }
  py.globals.set("__file__",WORKSPACE+"/"+scriptName);
  fetchAttempts=0;missingFiles.clear();
  py.runPython("_viewer_images.clear()");
  let stdout="",stderr="";
  const limit=200000;
  const append=(target,msg)=>String(target+msg+"\n").slice(-limit);
  py.setStdout({batched:msg=>{stdout=append(stdout,msg)}});
  py.setStderr({batched:msg=>{stderr=append(stderr,msg)}});
  if(typeof stdin!=="string"||stdin.length>100000)
    throw new Error("Python stdin must be text under 100 KB");
  py.globals.set("_viewer_stdin_text",stdin);
  py.runPython(`import builtins
if not hasattr(builtins, "_viewer_original_input"):
    builtins._viewer_original_input = builtins.input
_viewer_input_lines = iter(_viewer_stdin_text.splitlines())
def _viewer_input(prompt=""):
    if prompt:
        print(prompt, end="")
    try:
        return next(_viewer_input_lines)
    except StopIteration:
        raise EOFError("No more supplied Python input lines")
builtins.input = _viewer_input
`);
  await py.loadPackagesFromImports(code);
  let result=null;
  try{
    const value=await py.runPythonAsync(code);
    if(value!==undefined&&value!==null){
      result=String(value);
      value?.destroy?.();
    }
  }catch(error){
    stderr=append(stderr,String(error?.message||error));
    throw {message:String(error?.message||error),stdout,stderr};
  }
  // Every plt.show()/Figure.show() already emitted a figure into the UI feed.
  // Capture still-open figures only, so scripts without show() retain previews.
  let figures=[];
  try{
    const proxy=py.runPython("_viewer_complete_figures()");
    figures=proxy.toJs();
    proxy.destroy?.();
  }catch(error){stderr=append(stderr,"Figure preview: "+String(error))}
  return {stdout,stderr,result,figures,files:generatedFiles(py)};
}
self.onmessage=async({data})=>{
  const id=data?.id,command=data?.type;
  try{
    if(command==="run"){
      send({id,phase:"loading"});
      activeRunId=id;
      try{
        const result=await run(data.code,data.stdin||"",data.sourceURL||"",data.siblingRelayURL||"");
        send({id,phase:"done",ok:true,...result});
      }finally{activeRunId=null}
    }else if(command==="mount"){
      send({id,phase:"loading"});
      const result=await mountFiles(data.files);
      send({id,phase:"done",ok:true,...result});
    }else if(command==="ping"){
      send({id,phase:"done",ok:true,message:"Python Worker ready"});
    }else throw new Error("Unknown Python Worker command");
  }catch(error){
    send({id,phase:"done",ok:false,error:error?.message||String(error),
      stdout:error?.stdout||"",stderr:error?.stderr||""});
  }
};
