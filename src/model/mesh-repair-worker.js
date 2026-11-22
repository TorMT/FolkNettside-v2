import {previewHydroMeshRepair} from "./mesh-repair.js?v=006c7e6f7dcf9ff7d3ec52dcb41c83a07f2c2766";

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
