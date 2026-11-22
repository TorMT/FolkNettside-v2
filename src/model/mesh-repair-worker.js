import {previewHydroMeshRepair} from "./mesh-repair.js?v=906d934ae3aa2b43c5d1f5bdc0422e6b2240cd78";

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
