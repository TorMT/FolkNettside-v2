import {diveDistanceKm,diveFeaturePoint,diveOriginalId} from "./dive-core.js";

export const DIVE_CATALOG_FILES=[
  "./data/diving/norway-additions.geojson",
  "./data/diving/local-enrichments.geojson",
  ...Array.from({length:6},(_,i)=>`./data/diving/dykkekart-${String(i+1).padStart(2,"0")}.geojson`),
  ...Array.from({length:7},(_,i)=>`./data/diving/open-divemap-${String(i+1).padStart(2,"0")}.geojson`),
  ...Array.from({length:4},(_,i)=>`./data/diving/osm-vibe-${String(i+1).padStart(2,"0")}.geojson`),
  "./data/diving/world-top500.geojson"
];

// Canonical key is only a candidate generator; geography still decides matches.
const normalized=value=>String(value||"").toLowerCase()
  .replace(/[’‘\u0060´']/g,"").replace(/ø/g,"o").replace(/æ/g,"ae").replace(/ß/g,"ss")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/^(?:d\/s|m\/s|s\/s)\s+/,"")
  .replace(/[^\p{L}\p{N}]+/gu,"").trim();

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
  if(diveOriginalId(id))return "original";
  if(ids.includes("pingvin")||ids.includes("scarsbrook")||ids.includes("dykkekart")||ids.includes("reefradar"))return "local";
  if(ids.includes("opendivemap")||id.startsWith("OD"))return "opendivemap";
  if(ids.includes("openstreetmap")||id.startsWith("OS"))return "osm";
  if(ids.includes("underwateratlas")||id.startsWith("GL"))return "atlas";
  return "dykkepedia";
}
function samePlace(a,b){
  if(diveCountry(a)!==diveCountry(b)||
    normalized(a.properties?.Navn)!==normalized(b.properties?.Navn))return false;
  const aPoint=diveFeaturePoint(a),bPoint=diveFeaturePoint(b);
  if(aPoint&&bPoint){
    const km=diveDistanceKm(aPoint,bPoint);
    const name=normalized(a.properties?.Navn);
    // Generic names frequently repeat: never merge two distant pinnacles
    // or wrecks merely because both are named "Shark Point", "The Wall", etc.
    // Vessel names are more distinctive than generic reefs. A short wreck
    // name with a vessel prefix can have slightly different published GPS.
    // Never extend this tolerance to generic walls/beaches/reefs.
    const aWreck=/vrak/i.test(String(a.properties?.Kategori||""));
    const bWreck=/vrak/i.test(String(b.properties?.Kategori||""));
    const namedVessel=/(?:^|\\b)(?:d\\/s|m\\/s|s\\/s)\\s+/i.test(String(a.properties?.Navn||""))||
      /(?:^|\\b)(?:d\\/s|m\\/s|s\\/s)\\s+/i.test(String(b.properties?.Navn||""))||
      /^u\\s*\\d+$/i.test(String(a.properties?.Navn||""));
    const limit=aWreck&&bWreck&&namedVessel?1.0:name.length<=10?0.35:1.2;
    return km!==null&&km<=limit;
  }
  // An unknown point is NOT the same thing as a nearby named site. Only
  // merge with an identical named region; the ranked index is addressed
  // separately when a unique country/name candidate is available.
  return normalized(diveRegion(a))===normalized(diveRegion(b));
}
function combine(a,b){
  const p=a.properties,q=b.properties;
  const aPoint=diveFeaturePoint(a),bPoint=diveFeaturePoint(b);
  const coordinateDifference=aPoint&&bPoint?diveDistanceKm(aPoint,bPoint):null;
  if(coordinateDifference!==null&&coordinateDifference>0.35){
    p.Kildeposisjon_avvik_m=Math.round(coordinateDifference*1000);
    p.Datakvalitet="C – kildeposisjoner avviker; kontroller dykkestedet lokalt";
    const caveat="Kildene oppgir ulike GPS-posisjoner (ca. "+
      Math.round(coordinateDifference*1000)+" m avstand). Kartpunktet er ikke verifisert.";
    if(!String(p.Notater||"").includes("Kildene oppgir ulike GPS-posisjoner"))
      p.Notater=[p.Notater,caveat].filter(Boolean).join(" ");
  }
  const URLs=[...(p.source_urls||[]),...(q.source_urls||[])];
  p.source_urls=[...new Set(URLs.filter(x=>typeof x==="string"))];
  for(const key of ["Observert_dyreliv","Mulig_rapportert_dyreliv","Vrak_historie","Adkomst","Bunn_terreng","Strøm_fare_forbehold"]){
    if(!p[key]&&q[key])p[key]=q[key];
  }
  if(p.Dybde_max_m==null&&q.Dybde_max_m!=null)p.Dybde_max_m=q.Dybde_max_m;
  if(!a.geometry&&b.geometry){a.geometry=b.geometry;p.Lat=q.Lat;p.Lon=q.Lon;}
  if(q.Global_rangering&&!p.Global_rangering)p.Global_rangering=q.Global_rangering;
  if(q.Navn!==p.Navn){
    p.Alternative_navn=[...new Set([...(p.Alternative_navn||[]),q.Navn].filter(Boolean))];
  }
  p.Kilde_IDer=[...new Set([p.Kilde_IDer,q.Kilde_IDer].filter(Boolean))].join(";");
  p.Antall_kilder=p.source_urls.length;
  return a;
}
// Preserve original IDs and positions; prevent same-place pins from multiple data sources.
export function mergeDiveCatalog(collections){
  const output=[],rankedLast=[];
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
    // The editorial Top 500 list lacks coordinates. Merge its rank only when
    // exactly one longer-name candidate exists in the same country.
    const uniquelyNamed=candidates.length===1&&normalized(f.properties?.Navn).length>=11;
    if(candidates.length===1&&(samePlace(candidates[0],f)||uniquelyNamed)){
      combine(candidates[0],f);continue;
    }
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
