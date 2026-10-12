import {occtToModelDocument,CAD_EXTENSIONS} from "./occt-cad.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
export const CAD_IMPORT_MAX_BYTES=25*1024*1024;
const FORMATS={step:"step",stp:"step",iges:"iges",igs:"iges",brep:"brep"};
export async function parseCADBuffer(buffer,name="CAD model",{
 format=String(name).split(".").pop().toLowerCase(),
 timeoutMs=120_000,signal,brepUnit="millimeter",workerFactory=url=>new Worker(url,{type:"module"})
}={}){
 const normalized=FORMATS[String(format).toLowerCase()];
 if(!["millimeter","meter","inch","centimeter"].includes(brepUnit))throw Error("Unsupported BREP source unit");
 if(!normalized)throw Error("Unsupported CAD extension");
 if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>CAD_IMPORT_MAX_BYTES)
   throw Error("CAD file must be between 1 byte and 25 MB");
 if(signal?.aborted)throw Error("CAD import cancelled");
 if(typeof Worker==="undefined"&&!workerFactory)throw Error("Browser Web Worker unavailable");
 const worker=workerFactory(new URL("./occt-worker.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc",import.meta.url));
 try{
   const result=await new Promise((resolve,reject)=>{
     let done=false;
     const finish=(callback,value)=>{
       if(done)return;done=true;
       clearTimeout(timer);
       signal?.removeEventListener("abort",onAbort);
       callback(value);
     };
     const onAbort=()=>finish(reject,new Error("CAD import cancelled"));
     const timer=setTimeout(()=>finish(reject,new Error("CAD conversion timed out; try a smaller assembly")),timeoutMs);
     signal?.addEventListener("abort",onAbort,{once:true});
     worker.onmessage=event=>{
       if(event.data?.id!==1)return;
       if(!event.data.success)finish(reject,new Error(event.data.error||"CAD geometry import failed"));
       else finish(resolve,event.data.result);
     };
     worker.onerror=error=>finish(reject,new Error("CAD worker unavailable: "+(error.message||"loading error")));
     worker.postMessage({id:1,format:normalized,buffer},[buffer]);
   });
   const outputUnit=normalized==="brep"?brepUnit:"millimeter";
   const model=occtToModelDocument(result,{name,format:normalized.toUpperCase(),unit:outputUnit});
   if(normalized==="brep")model.source.unitAssumption="BREP has no reliable unit metadata; user-selected "+brepUnit;
   return model;
 }finally{worker.terminate()}
}
export const isCADFile=name=>CAD_EXTENSIONS.includes(String(name).split(".").pop().toLowerCase());
