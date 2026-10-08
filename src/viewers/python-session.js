/**
 * Own one Python execution session per viewer. Repeated notebook cells share
 * Python globals; Stop destroys the Worker and therefore resets the session.
 */
export function createPythonSession({workerFactory=()=>new Worker(
  new URL("./python-worker.js",import.meta.url)
)}={}){
  let worker=null,seq=0,pending=new Map(),disposed=false;
  const init=()=>{
    if(disposed)throw new Error("Python session closed");
    if(worker)return worker;
    worker=workerFactory();
    worker.onmessage=event=>{
      const msg=event?.data||{};
      const entry=pending.get(msg.id);
      if(!entry)return;
      if(msg.phase==="loading"){entry.status?.("Loading Python runtime and packages…");return}
      pending.delete(msg.id);
      msg.ok?entry.resolve(msg):entry.reject(Object.assign(new Error(
        msg.error||"Python execution error"),{stdout:msg.stdout,stderr:msg.stderr}));
    };
    worker.onerror=event=>{
      reset(new Error(event.message||"Python Worker crashed"));
    };
    return worker;
  };
  const reset=(reason=new Error("Python execution stopped"))=>{
    for(const entry of pending.values())entry.reject(reason);
    pending.clear();worker?.terminate();worker=null;
  };
  return {
    run(code,{status}={}){
      const active=init();
      const id=++seq;
      return new Promise((resolve,reject)=>{
        pending.set(id,{resolve,reject,status});
        try{active.postMessage({id,type:"run",code})}
        catch(error){pending.delete(id);reject(error)}
      });
    },
    stop(){reset()},
    dispose(){disposed=true;reset(new Error("Python viewer closed"))},
    get running(){return pending.size>0}
  };
}
