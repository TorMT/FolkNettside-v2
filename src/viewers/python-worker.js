/* Dedicated, disposable Pyodide Web Worker.
 * This isolates long-running computation from the UI thread, but is NOT a
 * security boundary for untrusted Python (Pyodide can access JS APIs).
 * Nothing runs until the user explicitly selects Run.
 */
const PYODIDE_VERSION="0.27.7";
const PYODIDE_BASE="https://cdn.jsdelivr.net/pyodide/v"+PYODIDE_VERSION+"/full/";
let runtime=null,bootstrap=null;
const send=(message)=>self.postMessage(message);
async function ensurePython(){
  if(runtime)return runtime;
  if(!bootstrap)bootstrap=(async()=>{
    importScripts(PYODIDE_BASE+"pyodide.js");
    const loaded=await self.loadPyodide({indexURL:PYODIDE_BASE});
    return loaded;
  })();
  try{runtime=await bootstrap;return runtime}
  catch(error){bootstrap=null;throw error}
}
async function run(code){
  const py=await ensurePython();
  if(typeof code!=="string"||code.length>500000)
    throw new Error("Python source must be text under 500 KB");
  let stdout="",stderr="";
  const limit=200000;
  const append=(target,msg)=>String(target+msg+"\n").slice(-limit);
  py.setStdout({batched:msg=>{stdout=append(stdout,msg)}});
  py.setStderr({batched:msg=>{stderr=append(stderr,msg)}});
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
  if(py.loadedPackages?.matplotlib){
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
  return {stdout,stderr,result,figures};
}
self.onmessage=async({data})=>{
  const id=data?.id,command=data?.type;
  try{
    if(command==="run"){
      send({id,phase:"loading"});
      const result=await run(data.code);
      send({id,phase:"done",ok:true,...result});
    }else if(command==="ping"){
      send({id,phase:"done",ok:true,message:"Python Worker ready"});
    }else throw new Error("Unknown Python Worker command");
  }catch(error){
    send({id,phase:"done",ok:false,error:error?.message||String(error),
      stdout:error?.stdout||"",stderr:error?.stderr||""});
  }
};
