import {executeHydroRequest} from "./hydro-service.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9";

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
