const DEFAULT_READY={
  enabled:true,
  status:"configured",
  reason:"",
  requirements:[]
};

export function analysisCapability(modelConfig={},name){
  const raw=modelConfig?.analysisCapabilities?.[name];
  if(raw===undefined||raw===null){
    if(name==="model")return {...DEFAULT_READY,status:"available",source:"implicit"};
    return {
      enabled:false,
      status:"not declared",
      reason:"This model does not declare the inputs or validation required for this analysis.",
      requirements:[],
      source:"implicit"
    };
  }
  if(typeof raw==="boolean"){
    return {
      enabled:raw,
      status:raw?"configured":"disabled",
      reason:"",
      requirements:[],
      source:"explicit"
    };
  }
  if(typeof raw==="string"){
    const enabled=["ready","configured","validated","available"].includes(raw);
    return {
      enabled,
      status:raw,
      reason:"",
      requirements:[],
      source:"explicit"
    };
  }
  const enabled=raw.enabled!==false;
  return {
    enabled,
    status:String(raw.status|| (enabled?"configured":"disabled")),
    reason:String(raw.reason||""),
    requirements:Array.isArray(raw.requirements)?raw.requirements.map(String):[],
    source:"explicit"
  };
}

export function modelCapabilitySummary(modelConfig={}){
  const names=["model","hydro","structure","resistance","propulsion"];
  return Object.fromEntries(names.map(name=>[name,analysisCapability(modelConfig,name)]));
}

export function capabilityLabel(capability){
  const status=String(capability?.status||"configured")
    .replace(/[-_]+/g," ")
    .replace(/\b\w/g,match=>match.toUpperCase());
  return capability?.enabled?status:`Blocked · ${status}`;
}
