import {executeHydroRequest} from "./hydro-service.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22";

let modelDocument=null;

self.onmessage=event=>{
  const {id,type,payload={}}=event.data||{};
  try{
    if(type==="setModel"){
      modelDocument=payload.modelDocument;
      self.postMessage({id,ok:true,result:{components:modelDocument?.components?.length||0}});
      return;
    }
    const result=executeHydroRequest(modelDocument,type,payload);
    self.postMessage({id,ok:true,result});
  }catch(error){
    self.postMessage({id,ok:false,error:String(error?.message||error)});
  }
};
