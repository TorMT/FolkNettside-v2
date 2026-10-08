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
const send=(message)=>self.postMessage(message);
async function ensurePython(){
  if(runtime)return runtime;
  if(!bootstrap)bootstrap=(async()=>{
    importScripts(PYODIDE_BASE+"pyodide.js");
    const loaded=await self.loadPyodide({indexURL:PYODIDE_BASE});
    loaded.FS.mkdirTree(WORKSPACE);
    loaded.runPython('import os; os.chdir("/home/pyodide/workspace")');
    return loaded;
  })();
  try{runtime=await bootstrap;return runtime}
  catch(error){bootstrap=null;throw error}
}
function safeName(name){
  const value=String(name||"").replace(/\\/g,"/");
  const base=value.split("/").pop();
  if(!base||base==="."||base===".."||!/[a-zA-Z0-9]/.test(base))
    throw new Error("Invalid Python workspace filename");
  return base.replace(/[^a-zA-Z0-9_.() +\-]/g,"_").slice(0,140);
}
async function mountFiles(files){
  if(!Array.isArray(files)||files.length>40)
    throw new Error("Choose at most 40 local files");
  const py=await ensurePython();
  let total=0;
  for(const file of files){
    const name=safeName(file?.name);
    const bytes=file?.data instanceof Uint8Array?file.data:new Uint8Array(file?.data||0);
    if(bytes.length>8_000_000||(total+=bytes.length)>25_000_000)
      throw new Error("Input files exceed the 8 MB per-file / 25 MB total limit");
    py.FS.writeFile(WORKSPACE+"/"+name,bytes);
    uploadedFiles.add(name);
  }
  return {mounted:files.length,filenames:[...uploadedFiles]};
}
function generatedFiles(py){
  const outputs=[];
  for(const name of py.FS.readdir(WORKSPACE)){
    if(uploadedFiles.has(name)||name==="."||name===".."||name==="__pycache__")continue;
    if(name.startsWith("."))continue;
    const path=WORKSPACE+"/"+name;
    let stat;
    try{stat=py.FS.stat(path)}catch{continue}
    if(!py.FS.isFile(stat.mode)||stat.size>4_000_000||stat.size<1)continue;
    if(outputs.length>=15)break;
    outputs.push({name,bytes:py.FS.readFile(path)});
  }
  return outputs;
}
async function run(code,stdin=""){
  const py=await ensurePython();
  if(typeof code!=="string"||code.length>500000)
    throw new Error("Python source must be text under 500 KB");
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
  const figures=[];
  // Matplotlib is a Python module, not a property on Pyodide's JS
  // loadedPackages object. Inspect sys.modules to detect user figures.
  const matplotlibLoaded=Boolean(py.runPython(
    'import sys; "matplotlib.pyplot" in sys.modules'));
  if(matplotlibLoaded){
    try{
      const plots=py.runPython(`import io,base64
from matplotlib import pyplot as plt
_result_images=[]
for _figure_id in list(plt.get_fignums())[:10]:
    _figure=plt.figure(_figure_id)
    _buf=io.BytesIO()
    _figure.savefig(_buf,format='png',dpi=110,bbox_inches='tight')
    _result_images.append('data:image/png;base64,'+base64.b64encode(_buf.getvalue()).decode())
    plt.close(_figure)
_result_images`);
      figures.push(...plots.toJs());
      plots.destroy?.();
    }catch(error){stderr=append(stderr,"Plot preview: "+String(error))}
  }
  return {stdout,stderr,result,figures,files:generatedFiles(py)};
}
self.onmessage=async({data})=>{
  const id=data?.id,command=data?.type;
  try{
    if(command==="run"){
      send({id,phase:"loading"});
      const result=await run(data.code,data.stdin||"");
      send({id,phase:"done",ok:true,...result});
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
