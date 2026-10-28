import {executeHydroRequest} from "./hydro-service.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";

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
