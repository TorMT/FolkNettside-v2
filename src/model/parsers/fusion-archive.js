import {getJSZip} from "../../vendor/jszip.js?v=5847de308f81a28abf005e6bee53d1782423cc42";
import {parse3MF} from "./three-mf.js?v=5847de308f81a28abf005e6bee53d1782423cc42";
import {parseSTL} from "./stl.js?v=5847de308f81a28abf005e6bee53d1782423cc42";

export class FusionConversionRequiredError extends Error{
  constructor(message="Native Fusion geometry requires Autodesk APS conversion"){
    super(message);
    this.name="FusionConversionRequiredError";
    this.code="APS_REQUIRED";
  }
}

export function selectFusionArchiveCandidate(paths=[]){
  const files=paths
    .filter(Boolean)
    .map(path=>String(path))
    .filter(path=>!path.endsWith("/"));

  const rank=path=>{
    const lower=path.toLowerCase();
    if(lower.endsWith(".3mf"))return 0;
    if(lower.endsWith(".stl"))return 1;
    return 99;
  };

  const candidates=files
    .map(path=>({path,rank:rank(path)}))
    .filter(item=>item.rank<99)
    .sort((a,b)=>a.rank-b.rank||a.path.localeCompare(b.path));

  return candidates[0]?.path||null;
}

export function selectSemanticManifestCandidate(paths=[]){
  const preferred=[
    "folknet-semantic.json",
    "model-semantic.json",
    ".folknet/semantic.json"
  ];
  const files=paths.map(path=>String(path)).filter(path=>!path.endsWith("/"));
  for(const name of preferred){
    const exact=files.find(path=>path.toLowerCase()===name);
    if(exact)return exact;
  }
  return files.find(path=>/(^|\/)folknet-semantic\.json$/i.test(path))
    ||files.find(path=>/(^|\/)model-semantic\.json$/i.test(path))
    ||null;
}

export function fusionArchiveInventory(paths=[]){
  const list=paths.map(path=>String(path)).filter(Boolean);
  return {
    entries:list.length,
    threeMF:list.filter(path=>path.toLowerCase().endsWith(".3mf")).length,
    stl:list.filter(path=>path.toLowerCase().endsWith(".stl")).length,
    nativeFusion:list.filter(path=>/\.(f3d|f3z)$/i.test(path)).length,
    candidate:selectFusionArchiveCandidate(list),
    semanticManifest:selectSemanticManifestCandidate(list)
  };
}

export function applySemanticManifest(model,manifest={}){
  const entries=Array.isArray(manifest?.components)?manifest.components:[];
  const applied=[];
  for(const entry of entries){
    const component=(model?.components||[]).find(candidate=>
      entry.id!=null&&String(candidate.id)===String(entry.id)
      ||entry.sourceObjectId!=null&&String(candidate.sourceObjectId)===String(entry.sourceObjectId)
      ||entry.name!=null&&String(candidate.name)===String(entry.name)
    );
    if(!component)continue;
    component.metadata={
      ...(component.metadata||{}),
      semantic:{
        ...(component.metadata?.semantic||{}),
        ...(entry.semantic||{})
      }
    };
    if(entry.propulsion){
      component.metadata.propulsion={
        ...(component.metadata.propulsion||{}),
        ...entry.propulsion
      };
    }
    if(entry.hydro!==undefined)component.metadata.hydro=entry.hydro;
    applied.push(component.id);
  }
  model.semanticManifest={
    version:manifest?.version??1,
    vessel:manifest?.vessel||null,
    source:manifest?.source||null,
    appliedComponentIds:applied
  };
  return model;
}

export async function parseFusionArchive(buffer,name="Fusion archive"){
  const JSZip=await getJSZip();
  let zip;
  try{
    zip=await JSZip.loadAsync(buffer);
  }catch(error){
    throw new FusionConversionRequiredError(
      "Could not read F3Z as an archive. Native Fusion conversion through Autodesk APS is required."
    );
  }

  const paths=Object.keys(zip.files);
  const inventory=fusionArchiveInventory(paths);
  const candidate=inventory.candidate;
  if(!candidate){
    const error=new FusionConversionRequiredError(
      "F3Z contains no embedded 3MF/STL fallback geometry. Autodesk APS conversion is required."
    );
    error.inventory=inventory;
    throw error;
  }

  const entry=zip.file(candidate);
  if(!entry)throw new Error(`Fusion archive entry not found: ${candidate}`);
  const embedded=await entry.async("arraybuffer");

  let model;
  if(candidate.toLowerCase().endsWith(".3mf")){
    model=await parse3MF(embedded,name);
  }else{
    model=parseSTL(embedded,name);
  }

  model.format="F3Z";
  model.source={
    format:"F3Z",
    archiveEntry:candidate,
    embeddedFormat:candidate.split(".").pop().toUpperCase(),
    conversion:"embedded-fallback",
    inventory
  };

  if(inventory.semanticManifest){
    const manifestEntry=zip.file(inventory.semanticManifest);
    if(manifestEntry){
      try{
        const manifest=JSON.parse(await manifestEntry.async("string"));
        applySemanticManifest(model,manifest);
        model.source.semanticManifest=inventory.semanticManifest;
      }catch(error){
        model.source.semanticManifest=inventory.semanticManifest;
        model.source.semanticManifestError=String(error?.message||error);
      }
    }
  }
  for(const component of model.components){
    component.metadata={
      ...component.metadata,
      fusionArchiveEntry:candidate
    };
  }
  return model;
}

export function nativeFusionPlaceholder({name="Fusion model",format="F3D"}={}){
  throw new FusionConversionRequiredError(
    `${format} model "${name}" requires Autodesk APS conversion before it can become a ModelDocument.`
  );
}
