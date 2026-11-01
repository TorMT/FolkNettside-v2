import {diveDistanceKm,diveFeaturePoint} from "./dive-core.js";

export const DIVE_CATALOG_FILES=[
  "./data/diving/norway-additions.geojson",
  "./data/diving/local-enrichments.geojson",
  ...Array.from({length:7},(_,i)=>`./data/diving/open-divemap-${String(i+1).padStart(2,"0")}.geojson`),
  "./data/diving/world-top500.geojson"
];

const normalized=value=>String(value||"").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();

export function diveCountry(feature){
  const raw=String(feature?.properties?.Land||"Norge").trim();
  return /^(norway|norge)$/i.test(raw)?"Norge":raw||"Ukjent";
}
export function diveRegion(feature){
  const raw=String(feature?.properties?.Område||"").trim();
  return raw||diveCountry(feature);
}
export function diveSourceGroup(feature){
  const p=feature?.properties||{};
  const ids=String(p.Kilde_IDer||"").toLowerCase();
  const id=String(p.ID||feature?.id||"");
  if(id.startsWith("D")||id.startsWith("W")||id.startsWith("X"))return "original";
  if(ids.includes("pingvin")||ids.includes("scarsbrook")||ids.includes("dykkekart"))return "local";
  if(ids.includes("opendivemap")||id.startsWith("OD"))return "opendivemap";
  if(ids.includes("underwateratlas")||id.startsWith("GL"))return "atlas";
  return "dykkepedia";
}
function samePlace(a,b){
  if(diveCountry(a)!==diveCountry(b)||
    normalized(a.properties?.Navn)!==normalized(b.properties?.Navn))return false;
  const aPoint=diveFeaturePoint(a),bPoint=diveFeaturePoint(b);
  if(aPoint&&bPoint){
    const km=diveDistanceKm(aPoint,bPoint);
    return km!==null&&km<8;
  }
  // An unlocated global-ranking item may be attached only to one unambiguous
  // exact name/country match. Ordinary missing-location records remain separate
  // unless their area matches.
  const atlas=diveSourceGroup(a)==="atlas"||diveSourceGroup(b)==="atlas";
  return atlas||normalized(diveRegion(a))===normalized(diveRegion(b));
}
function combine(a,b){
  const p=a.properties,q=b.properties;
  const URLs=[...(p.source_urls||[]),...(q.source_urls||[])];
  p.source_urls=[...new Set(URLs.filter(x=>typeof x==="string"))];
  for(const key of ["Observert_dyreliv","Mulig_rapportert_dyreliv","Vrak_historie","Adkomst","Bunn_terreng","Strøm_fare_forbehold"]){
    if(!p[key]&&q[key])p[key]=q[key];
  }
  if(p.Dybde_max_m==null&&q.Dybde_max_m!=null)p.Dybde_max_m=q.Dybde_max_m;
  if(!a.geometry&&b.geometry){a.geometry=b.geometry;p.Lat=q.Lat;p.Lon=q.Lon;}
  if(q.Global_rangering&&!p.Global_rangering)p.Global_rangering=q.Global_rangering;
  p.Kilde_IDer=[...new Set([p.Kilde_IDer,q.Kilde_IDer].filter(Boolean))].join(";");
  p.Antall_kilder=p.source_urls.length;
  return a;
}
// Preserve original IDs and positions; prevent same-place pins from multiple data sources.
export function mergeDiveCatalog(collections){
  const output=[],byName=new Map(),rankedLast=[];
  const all=collections.flatMap(c=>c?.features||[]);
  // Global ranking has no published map coordinates in its index. Add it last
  // so better referenced coordinates/depths are preferred.
  for(const f of all){
    if(diveSourceGroup(f)==="atlas")rankedLast.push(f);
    else output.push(structuredClone(f));
  }
  function dedup(items){
    const result=[],map=new Map();
    for(const f of items){
      const key=diveCountry(f)+"|"+normalized(f.properties?.Navn);
      const candidates=map.get(key)||[];
      const exact=candidates.filter(x=>samePlace(x,f));
      // In case of multiple namesakes, no unsafe merge.
      const target=exact.length===1?exact[0]:null;
      if(target){combine(target,f);continue;}
      result.push(f);
      map.set(key,[...candidates,f]);
    }
    return {result,map};
  }
  const initial=dedup(output);
  for(const raw of rankedLast){
    const f=structuredClone(raw),key=diveCountry(f)+"|"+normalized(f.properties?.Navn);
    const candidates=initial.map.get(key)||[];
    if(candidates.length===1&&samePlace(candidates[0],f)){combine(candidates[0],f);continue;}
    initial.result.push(f);
  }
  return initial.result;
}
export async function loadDiveCatalog(dataUrl="./data/diving/trondheim-sites.geojson",fetchImpl=fetch){
  async function get(url){
    const response=await fetchImpl(url,{cache:"no-cache"});
    if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
    const data=await response.json();
    if(data.type!=="FeatureCollection"||!Array.isArray(data.features))throw new Error(`${url}: invalid GeoJSON`);
    return data;
  }
  const original=await get(dataUrl);
  const supplementary=await Promise.allSettled(DIVE_CATALOG_FILES.map(get));
  const collections=[original,...supplementary.filter(x=>x.status==="fulfilled").map(x=>x.value)];
  const failed=supplementary.map((x,i)=>x.status==="rejected"?DIVE_CATALOG_FILES[i]:null).filter(Boolean);
  return {features:mergeDiveCatalog(collections),metadata:original.metadata||{},failed,
    sources:collections.map(c=>c.metadata?.title||"Source")};
}
