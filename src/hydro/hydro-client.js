import {analyzeModelDocument,hydroCurve,solveWaterlineForVolume} from "./hydrostatics.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";
import {createHydroInclude} from "./hydro-selection.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";

let worker=null;
let currentModel=null;
let requestId=0;
const pending=new Map();

function ensureWorker(){
  if(worker||typeof Worker==="undefined")return worker;
  worker=new Worker(new URL("./hydro-worker.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6",import.meta.url),{type:"module"});
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
  return analyzeModelDocument(modelDocument,waterline,{include:createHydroInclude(modelDocument)});
}

export async function hydroCurveAsync(modelDocument,options){
  await ensureModel(modelDocument);
  const queued=request("curve",options);
  if(queued)return queued;
  return hydroCurve(modelDocument,{...options,include:createHydroInclude(modelDocument)});
}

export async function solveHydroDraftAsync(modelDocument,targetVolume,options){
  await ensureModel(modelDocument);
  const queued=request("solve",{targetVolume,...options});
  if(queued)return queued;
  return solveWaterlineForVolume(modelDocument,targetVolume,{...options,include:createHydroInclude(modelDocument)});
}

export function disposeHydroWorker(){
  worker?.terminate();
  worker=null;
  currentModel=null;
  pending.clear();
}
