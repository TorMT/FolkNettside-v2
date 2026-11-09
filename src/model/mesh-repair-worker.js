import {previewHydroMeshRepair} from "./mesh-repair.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";

// Run triangulation search off the UI thread. The caller retains the source
// document and must explicitly apply a successful preview.
self.onmessage=event=>{
  try{
    const {model,selectedIds}=event.data;
    const result=previewHydroMeshRepair(model,{selectedIds});
    self.postMessage({result});
  }catch(error){
    self.postMessage({error:String(error?.message||error)});
  }
};
