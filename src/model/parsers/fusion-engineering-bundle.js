/**
 * FolkNet Fusion Engineering Bundle v1 (ZIP):
 * - folknet-fusion.json: explicit, source-qualified Fusion measurements
 * - assembly.step: neutral geometry for V2's existing OpenCascade worker
 *
 * Do NOT confuse Fusion solid volume (material) with displaced hull volume.
 * There is no automatic hull tagging, hydro enablement, or derived EI.
 */
import {getJSZip} from "../../vendor/jszip.js?v=1b774962b35bf90b16b099cda4efa03bb73460a3";
import {parseCADBuffer} from "./cad-runtime.js?v=1b774962b35bf90b16b099cda4efa03bb73460a3";

const MAX_ARCHIVE=55*1024*1024, MAX_STEP=25*1024*1024;
const MAX_JSON=1024*1024, MAX_ENTRIES=30;
const plausiblePath=path=>typeof path==="string"&&path.length>0&&path.length<180&&
  !path.startsWith("/")&&!path.includes("\\")&&
  path.split("/").every(x=>x&&x!=="."&&x!=="..");
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const vec3=arr=>Array.isArray(arr)&&arr.length===3&&arr.every(finite);
const limited=s=>String(s??"").slice(0,300);
const INERTIA_KEYS=["xx","yy","zz","xy","yz","xz"];
/** Optional Fusion-measured inertia. Values are kg*m²; no tensor-sign inference. */
function readInertia(physical,label){
 const extra={};
 if(physical.inertiaWorldKgM2!==undefined){
   const x=physical.inertiaWorldKgM2;
   if(!x||typeof x!=="object"||Array.isArray(x)||
      !INERTIA_KEYS.every(k=>finite(x[k]))||
      ["xx","yy","zz"].some(k=>x[k]<0))
     throw Error("Invalid Fusion world inertia for "+label);
   extra.inertiaWorldKgM2=Object.fromEntries(INERTIA_KEYS.map(k=>[k,x[k]]));
 }
 if(physical.principalMomentsKgM2!==undefined){
   const values=physical.principalMomentsKgM2;
   if(!vec3(values)||values.some(v=>v<0))
     throw Error("Invalid Fusion principal moments for "+label);
   extra.principalMomentsKgM2=values.slice();
 }
 return extra;
}

export function validateFusionEngineeringManifest(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||
   raw.schema!=="folknet-fusion-v1")
   throw Error("Unsupported Fusion engineering manifest version");
 const geometryPath=raw.geometry?.path;
 if(!plausiblePath(geometryPath)||!/\.st(e|)p$/i.test(geometryPath))
   throw Error("Fusion bundle must reference a safe STEP geometry path");
 if(raw.geometry?.units!=="millimeter")
   throw Error("Fusion STEP output units must explicitly be millimeter");
 if(raw.properties?.lengthUnit!=="m"||raw.properties?.volumeUnit!=="m3"||
   raw.properties?.massUnit!=="kg"||raw.properties?.centerUnit!=="m")
   throw Error("Fusion engineering measurements must explicitly use SI units");
 const total=raw.total||{};
 if(raw.properties?.inertiaUnit!==undefined&&raw.properties.inertiaUnit!=="kg*m2")
   throw Error("Fusion inertia units must be kg*m2");
 const hasInertia=[total,...(Array.isArray(raw.occurrences)?raw.occurrences:[])]
   .some(x=>x&&(x.inertiaWorldKgM2!==undefined||
     x.principalMomentsKgM2!==undefined));
 if(hasInertia&&raw.properties?.inertiaUnit!=="kg*m2")
   throw Error("Fusion inertia measurements require explicit kg*m2 units");
 if(!finite(total.massKg)||total.massKg<0||
   !finite(total.solidVolumeM3)||total.solidVolumeM3<0||
   !vec3(total.centerOfMassM))
   throw Error("Fusion assembly total mass, volume or center-of-mass is invalid");
 if(total.surfaceAreaM2!==undefined&&
   (!finite(total.surfaceAreaM2)||total.surfaceAreaM2<0))
   throw Error("Fusion surface area must be finite and nonnegative");
 if(total.boundsM!==undefined){
   const bb=total.boundsM;
   if(!vec3(bb?.min)||!vec3(bb?.max)||
     bb.min.some((n,i)=>n>bb.max[i]))
     throw Error("Fusion bounding extents must be ordered finite XYZ coordinates");
 }
 if(!Array.isArray(raw.occurrences)||raw.occurrences.length>1000)
   throw Error("Fusion assembly occurrence inventory exceeds limit");
 const occurrences=raw.occurrences.map((occ,i)=>{
   if(!occ||typeof occ!=="object"||!finite(occ.massKg)||occ.massKg<0||
     !finite(occ.solidVolumeM3)||occ.solidVolumeM3<0||
     !vec3(occ.centerOfMassM))
     throw Error("Invalid Fusion assembly occurrence "+(i+1));
   return {name:limited(occ.name),fullPath:limited(occ.fullPath),
     massKg:occ.massKg,solidVolumeM3:occ.solidVolumeM3,
     centerOfMassM:occ.centerOfMassM.slice(),
     ...readInertia(occ,"occurrence "+(i+1)),
     material:limited(occ.material||""),
     isOccurrenceAggregate:true};
 });
 return {
   schema:raw.schema,
   title:limited(raw.title||"Fusion engineering model"),
   exportedAt:limited(raw.exportedAt),
   sourceProduct:"Autodesk Fusion",
   sourceFile:limited(raw.sourceFile||""),
   geometry:{path:geometryPath,format:"STEP",units:"millimeter"},
   properties:{...raw.properties},
   total:{
     massKg:total.massKg,solidVolumeM3:total.solidVolumeM3,
     centerOfMassM:total.centerOfMassM.slice(),
     ...readInertia(total,"assembly"),
     ...(total.surfaceAreaM2===undefined?{}:{surfaceAreaM2:total.surfaceAreaM2}),
     ...(total.boundsM===undefined?{}:{boundsM:{min:total.boundsM.min.slice(),max:total.boundsM.max.slice()}}),
     // Fusion body/assembly physical properties are independent of Hydro.
     qualification:"Fusion physical properties from assigned CAD materials"
   },
   occurrences,
   notes:[
     "Fusion total is used as supplied, never the sum of nested occurrence aggregates",
     "Solid material volume is not a vessel's water displacement",
     "Imported STEP geometry is a tessellated visual representation; Hydro remains unqualified",
     "E, plate scantlings, and structural EI cannot be inferred from assigned appearance alone"
   ]
 };
}

function verifyZipContents(zip){
 const entries=Object.values(zip.files).filter(x=>!x.dir);
 if(entries.length>MAX_ENTRIES)throw Error("Fusion bundle has too many archive entries");
 let sum=0;
 for(const entry of entries){
   if(!plausiblePath(entry.name))throw Error("Unsafe Fusion bundle path");
   const bytes=Number(entry._data?.uncompressedSize);
   if(!Number.isSafeInteger(bytes)||bytes<0||bytes>MAX_STEP)
     throw Error("Fusion bundle has an oversized or malformed entry");
   sum+=bytes;
   if(sum>MAX_ARCHIVE)throw Error("Fusion bundle exceeds decompressed size limit");
 }
 return entries;
}
export async function parseFusionEngineeringBundle(buffer,name="Fusion engineering bundle",options={}){
 if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>MAX_ARCHIVE)
   throw Error("Fusion bundle exceeds 55 MiB limit");
 const Zip=await getJSZip();
 const zip=await Zip.loadAsync(buffer);
 verifyZipContents(zip);
 const entry=zip.file("folknet-fusion.json");
 if(!entry||Number(entry._data.uncompressedSize)>MAX_JSON)
   throw Error("Missing or oversized folknet-fusion.json export from Fusion");
 const raw=await entry.async("string");
 if(raw.length>MAX_JSON)throw Error("Fusion engineering manifest is too large");
 let manifest;
 try{manifest=validateFusionEngineeringManifest(JSON.parse(raw))}
 catch(e){throw Error("Invalid Fusion engineering manifest: "+String(e?.message||e))}
 const stepEntry=zip.file(manifest.geometry.path);
 if(!stepEntry||Number(stepEntry._data?.uncompressedSize)>MAX_STEP)
   throw Error("Fusion STEP geometry is missing or too large");
 if(options.signal?.aborted)throw Error("Fusion bundle import cancelled");
 const step=await stepEntry.async("arraybuffer");
 if(step.byteLength>MAX_STEP)throw Error("Fusion STEP exceeds size limit");
 // The existing conversion worker is responsible for real CAD surface
 // tessellation. Do not treat raw ZIP or a thumbnail as mesh geometry.
 const converter=options.cadParser||parseCADBuffer;
 const model=await converter(step,manifest.title,{
   format:"step",signal:options.signal,timeoutMs:options.timeoutMs
 });
 model.source={
   ...(model.source||{}),format:"FUSION_BUNDLE",
   originalName:name,
   conversion:"fusion-step-with-qualified-api-properties",
   stepPath:manifest.geometry.path,
   exactBrepInBrowser:false
 };
 model.fusionEngineering=manifest;
 model.format="FUSION_BUNDLE";
 // Every STEP component is unqualified for hull hydro or structural section
 // until the user separately verifies its shell, winding and semantics.
 for(const component of model.components){
   component.metadata={
     ...(component.metadata||{}),
     hydro:false,uncertified:true,
     fusionSource:"unmapped-step-component"
   };
 }
 return model;
}
