import {executeHydroRequest} from "./hydro-service.js?v=fb1f3012a5633882a524abbb6feba0b215688eca";

let worker=null;
let currentModel=null;
let requestId=0;
const pending=new Map();

function ensureWorker(){
  if(worker||typeof Worker==="undefined")return worker;
  worker=new Worker(new URL("./hydro-worker.js?v=fb1f3012a5633882a524abbb6feba0b215688eca",import.meta.url),{type:"module"});
  worker.onmessage=event=>{
    const {id,ok,result,error}=event.data||{};
    const entry=pending.get(id);
    if(!entry)return;
    pending.delete(id);
    ok?entry.resolve(result):entry.reject(new Error(error||"Hydro worker error"));
  };
  worker.onerror=event=>{
    for(const entry of pending.values())entry.reject(new Error(event.message||"Hydro worker failed"));
    pending.clear();
    worker?.terminate();
    worker=null;
    currentModel=null;
  };
  return worker;
}

function request(type,payload){
  const active=ensureWorker();
  if(!active)return null;
  const id=++requestId;
  return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    active.postMessage({id,type,payload});
  });
}

async function ensureModel(modelDocument){
  if(currentModel===modelDocument)return;
  const active=ensureWorker();
  if(!active){currentModel=modelDocument;return}
  await request("setModel",{modelDocument});
  currentModel=modelDocument;
}

export async function analyzeHydroAsync(modelDocument,waterline){
  await ensureModel(modelDocument);
  const queued=request("analyze",{waterline});
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"analyze",{waterline});
}

export async function integrateHullPressureAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("pressure",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"pressure",options);
}

export async function hydroCurveAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("curve",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"curve",options);
}

export async function solveHydroDraftAsync(modelDocument,targetVolume,options){
  await ensureModel(modelDocument);
  const queued=request("solve",{targetVolume,...options});
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"solve",{targetVolume,...options});
}

export async function attitudeHydroAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("attitude",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"attitude",options);
}

export async function attitudeCurveAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("attitudeCurve",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"attitudeCurve",options);
}

export async function solveAttitudeEquilibriumAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("equilibrium",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"equilibrium",options);
}

export async function gzCurveAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("gz",options);
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"gz",options);
}

export function disposeHydroWorker(){
  worker?.terminate();
  worker=null;
  currentModel=null;
  pending.clear();
}

export async function validateHydroAsync(modelDocument){
  await ensureModel(modelDocument);
  const queued=request("validate",{});
  if(queued)return queued;
  return executeHydroRequest(modelDocument,"validate",{});
}
