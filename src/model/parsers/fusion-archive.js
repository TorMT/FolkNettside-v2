import {getJSZip} from "../../vendor/jszip.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parse3MF} from "./three-mf.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseSTL} from "./stl.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {parseCADBuffer} from "./cad-runtime.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {createModelDocument} from "../model-document.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {toArrayBuffer} from "../binary-input.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {isArchiveJunk,withoutArchiveJunk} from "./archive-paths.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";

const MAX_ARCHIVE_BYTES=55*1024*1024;
const MAX_NESTED_BYTES=38*1024*1024;
const MAX_EMBEDDED_BYTES=25*1024*1024;
// Fusion "export every body as STL" yields one file per body.
const MAX_STL_BODIES=64;
const baseName=path=>String(path).split("/").pop();

export class FusionConversionRequiredError extends Error{
  constructor(message="Native Fusion geometry requires Autodesk APS conversion"){
    super(message);
    this.name="FusionConversionRequiredError";
    this.code="APS_REQUIRED";
  }
}

const candidateRank=path=>{
  const lower=path.toLowerCase();
  if(lower.endsWith(".3mf"))return 0;
  if(lower.endsWith(".stl"))return 1;
  if(/\.(step|stp|iges|igs|brep)$/.test(lower))return 2;
  return 99;
};

/** All importable neutral-geometry entries, most preferred first.
 * OS bookkeeping stubs (`__MACOSX/._hull.stl`, `.DS_Store`, ...) are never
 * candidates even though they carry a geometry extension. */
export function selectFusionArchiveCandidates(paths=[]){
  return paths
    .filter(Boolean)
    .map(path=>String(path))
    .filter(path=>!path.endsWith("/")&&!isArchiveJunk(path))
    .map(path=>({path,rank:candidateRank(path)}))
    .filter(item=>item.rank<99)
    .sort((a,b)=>a.rank-b.rank||a.path.localeCompare(b.path));
}

export function selectFusionArchiveCandidate(paths=[]){
  return selectFusionArchiveCandidates(paths)[0]?.path||null;
}

export function selectSemanticManifestCandidate(paths=[]){
  const preferred=[
    "folknet-semantic.json",
    "model-semantic.json",
    ".folknet/semantic.json"
  ];
  const files=paths.map(path=>String(path)).filter(path=>!path.endsWith("/")&&!isArchiveJunk(path));
  for(const name of preferred){
    const exact=files.find(path=>path.toLowerCase()===name);
    if(exact)return exact;
  }
  return files.find(path=>/(^|\/)folknet-semantic\.json$/i.test(path))
    ||files.find(path=>/(^|\/)model-semantic\.json$/i.test(path))
    ||null;
}

export function fusionArchiveInventory(paths=[]){
  const list=withoutArchiveJunk(paths.map(path=>String(path)).filter(Boolean));
  return {
    entries:list.length,
    threeMF:list.filter(path=>path.toLowerCase().endsWith(".3mf")).length,
    stl:list.filter(path=>path.toLowerCase().endsWith(".stl")).length,
    cad:list.filter(path=>/\.(step|stp|iges|igs|brep)$/i.test(path)).length,
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

async function readEntryBytes(zip,path,budget){
  const entry=zip.file(path);
  if(!entry)throw new Error(`Fusion archive entry not found: ${path}`);
  const declared=Number(entry._data?.uncompressedSize||0);
  if(declared>budget.left)throw new Error("Embedded CAD file exceeds 25 MB safe browser import limit");
  const bytes=await entry.async("arraybuffer");
  if(bytes.byteLength>budget.left)throw new Error("Embedded CAD file exceeds 25 MB safe browser import limit");
  budget.left-=bytes.byteLength;
  return bytes;
}

const readable=(path,error)=>new Error(`Could not read ${path}: ${String(error?.message||error)}`);

/** STL bodies are independent files; import every one so a multi-body export
 * is not silently reduced to its alphabetically-first body. */
async function importSTLBodies(zip,paths,name){
  const bodies=paths.slice(0,MAX_STL_BODIES);
  const budget={left:MAX_EMBEDDED_BYTES};
  if(bodies.length===1){
    const bytes=await readEntryBytes(zip,bodies[0],budget);
    try{return {model:parseSTL(bytes,name),paths:bodies,omitted:0}}
    catch(error){throw readable(bodies[0],error)}
  }
  const components=[];
  for(const [index,path] of bodies.entries()){
    const bytes=await readEntryBytes(zip,path,budget);
    let body;
    try{body=parseSTL(bytes,baseName(path))}catch(error){throw readable(path,error)}
    const [component]=body.components;
    components.push({...component,id:"stl-"+(index+1),name:baseName(path),
      metadata:{...component.metadata,fusionArchiveEntry:path}});
  }
  return {model:createModelDocument({name,format:"STL",unit:"meter",components}),
    paths:bodies,omitted:paths.length-bodies.length};
}

async function importSingleEntry(zip,path,name){
  const bytes=await readEntryBytes(zip,path,{left:MAX_EMBEDDED_BYTES});
  const lower=path.toLowerCase();
  try{
    if(lower.endsWith(".3mf"))return {model:await parse3MF(bytes,name),paths:[path],omitted:0};
    return {model:await parseCADBuffer(bytes,name,{format:lower.split(".").pop()}),paths:[path],omitted:0};
  }catch(error){
    if(error?.code==="APS_REQUIRED"||error?.name==="AbortError")throw error;
    throw readable(path,error);
  }
}

/** Try the preferred format first; if it is unreadable fall back to the next
 * format instead of failing an archive that also holds a usable mesh. */
async function importBestGeometry(zip,candidates,name){
  const failures=[];
  const groups=[0,1,2].map(rank=>candidates.filter(item=>item.rank===rank).map(item=>item.path));
  for(const [rank,paths] of groups.entries()){
    if(!paths.length)continue;
    if(rank===1){
      try{return await importSTLBodies(zip,paths,name)}
      catch(error){failures.push(error)}
      continue;
    }
    for(const path of paths){
      try{return await importSingleEntry(zip,path,name)}
      catch(error){failures.push(error)}
    }
  }
  throw failures[0]||new Error("Fusion archive contains no readable geometry");
}

export async function parseFusionArchive(buffer,name="Fusion archive",depth=0,{JSZip:injectedJSZip=null}={}){
  if(depth>1)throw new FusionConversionRequiredError("Nested Fusion archive depth exceeded");
  const bytes=toArrayBuffer(buffer,"Fusion archive");
  if(!bytes.byteLength)throw new Error("Fusion archive is empty");
  if(bytes.byteLength>MAX_ARCHIVE_BYTES)throw new Error("Fusion archive exceeds safe size limit");
  const JSZip=injectedJSZip||await getJSZip();
  let zip;
  try{
    zip=await JSZip.loadAsync(bytes);
  }catch(error){
    throw new FusionConversionRequiredError(
      "Could not read "+(depth?"the nested design":"the file")+" as a ZIP archive ("+
      String(error?.message||error).slice(0,120)+
      "). Native Fusion conversion through Autodesk APS is required."
    );
  }

  const paths=Object.keys(zip.files).filter(path=>!zip.files[path]?.dir&&!isArchiveJunk(path));
  const inventory=fusionArchiveInventory(paths);
  const candidates=selectFusionArchiveCandidates(paths);
  if(!candidates.length){
    // Real F3Z packages typically hold F3D design documents rather than a
    // direct STEP/STL. Look one layer into bounded native designs for any
    // genuine neutral geometry; do not fabricate triangles from thumbnails.
    if(depth===0){
      for(const nestedPath of paths.filter(path=>/\.f3d$/i.test(path)).slice(0,12)){
        const nestedEntry=zip.file(nestedPath);
        if(!nestedEntry||Number(nestedEntry._data?.uncompressedSize||0)>MAX_NESTED_BYTES)continue;
        try{
          const nestedBytes=await nestedEntry.async("arraybuffer");
          if(nestedBytes.byteLength>MAX_NESTED_BYTES)continue;
          const parsed=await parseFusionArchive(nestedBytes,nestedPath,depth+1,{JSZip});
          parsed.format="F3Z";
          parsed.source={...parsed.source,format:"F3Z",
            archiveEntry:nestedPath+" / "+parsed.source.archiveEntry,
            nestedDesign:nestedPath};
          return parsed;
        }catch(error){
          // A native Fusion F3D need not include neutral fallback meshes.
          // Try other embedded designs. Non-geometric designs are still shown
          // as original archive previews through fusion-package-view.
          if(error?.code!=="APS_REQUIRED"&&error?.message?.includes("safe size"))throw error;
        }
      }
    }
    const error=new FusionConversionRequiredError(
      "Fusion archive contains no directly readable 3MF/STL/STEP/IGES/BREP geometry. Native F3D geometry requires an authorized Fusion or Autodesk translation."
    );
    error.inventory=inventory;
    throw error;
  }

  const {model,paths:usedPaths,omitted}=await importBestGeometry(zip,candidates,name);
  const candidate=usedPaths[0];

  const sourceFormat=String(name).toLowerCase().endsWith(".f3d")?"F3D":"F3Z";
  model.format=sourceFormat;
  model.source={
    format:sourceFormat,
    archiveEntry:candidate,
    embeddedFormat:candidate.split(".").pop().toUpperCase(),
    conversion:"embedded-fallback",
    inventory
  };
  if(usedPaths.length>1){
    model.source.archiveEntries=usedPaths;
    if(omitted)model.source.omittedBodies=omitted;
  }

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
      fusionArchiveEntry:candidate,
      ...component.metadata
    };
  }
  return model;
}

export function nativeFusionPlaceholder({name="Fusion model",format="F3D"}={}){
  throw new FusionConversionRequiredError(
    `${format} model "${name}" requires Autodesk APS conversion before it can become a ModelDocument.`
  );
}
