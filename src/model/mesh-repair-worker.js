import {previewHydroMeshRepair} from "./mesh-repair.js?v=b5862f49d322160eb24a824b8eca0a7461a30e26";

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
