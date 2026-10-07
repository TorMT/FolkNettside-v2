function plain(value){
  if(value===undefined)return null;
  if(value===null||typeof value==="string"||typeof value==="boolean")return value;
  if(typeof value==="number")return Number.isFinite(value)?value:null;
  if(Array.isArray(value))return value.map(plain);
  if(ArrayBuffer.isView(value))return Array.from(value,plain);
  if(typeof value==="object"){
    const out={};
    for(const [key,item] of Object.entries(value)){
      if(typeof item==="function"||key==="geometry")continue;
      out[key]=plain(item);
    }
    return out;
  }
  return String(value);
}

export function engineeringCaseReport({
  modelConfig={},
  modelDocument=null,
  mode,
  capability=null,
  method=null,
  inputs={},
  results={},
  assumptions=[],
  warnings=[],
  createdAt=new Date().toISOString()
}={}){
  const normalizedMode=String(mode||"Model");
  return {
    schema:"folknet.engineering-case",
    schemaVersion:1,
    createdAt,
    model:{
      id:modelConfig.id||null,
      name:modelDocument?.name||modelConfig.name||null,
      format:modelDocument?.format||modelConfig.format||null,
      unit:modelDocument?.unit||null,
      source:plain(modelDocument?.source||modelConfig.source||null)
    },
    analysis:{
      mode:normalizedMode,
      capability:capability?plain({
        enabled:Boolean(capability.enabled),
        status:capability.status,
        reason:capability.reason,
        requirements:capability.requirements||[]
      }):null,
      method:plain(method),
      inputs:plain(inputs),
      results:plain(results),
      assumptions:(assumptions||[]).map(String),
      warnings:(warnings||[]).map(String)
    }
  };
}

export function engineeringCaseFilename(report){
  const model=String(report?.model?.name||report?.model?.id||"engineering")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"engineering";
  const mode=String(report?.analysis?.mode||"case")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"case";
  return `${model}-${mode}-case.json`;
}

export function downloadEngineeringCase(report){
  const blob=new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=engineeringCaseFilename(report);
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
