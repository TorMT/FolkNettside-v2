import {previewHydroMeshRepair} from "./mesh-repair.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";

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
