function text(value){return String(value??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}

export function diveFeatureLevel(feature){
  const raw=String(feature?.properties?.Kilde_nivå||"").toLowerCase();
  if(raw.includes("trimix")||raw.includes("teknisk")||raw.includes("technical"))return "TECH";
  if(raw.includes("nivå 3")||raw.includes("niva 3")||/[23]\s*[–-]\s*3/.test(raw))return "P3";
  if(raw.includes("nivå 2")||raw.includes("niva 2"))return "P2";
  if(raw.includes("nivå 1")||raw.includes("niva 1"))return "P1";
  return "UNKNOWN";
}
export function diveFeatureKind(feature){
  const category=text(feature?.properties?.Kategori);
  return category.includes("vrak")||category.includes("lekter")||Boolean(feature?.properties?.Vrak_historie)?"wreck":"nature";
}
export function diveFeatureMaxDepth(feature){
  const raw=feature?.properties?.Dybde_max_m;
  if(raw===null||raw===undefined||raw==="")return null;
  const value=Number(raw);
  return Number.isFinite(value)?value:null;
}
export function diveFeatureQuality(feature){
  const raw=String(feature?.properties?.Datakvalitet||"").trim().toUpperCase();
  if(raw.startsWith("A"))return "A";
  if(raw.startsWith("B"))return "B";
  if(raw.startsWith("C"))return "C";
  return "UNKNOWN";
}

function splitWildlife(value){
  return String(value||"")
    .split(/[;,/]|\bog\b/gi)
    .map(item=>item.trim().replace(/^\d+[x×]?\s*/,""))
    .filter(item=>item.length>=3&&item.length<=42)
    .filter(item=>!["mye annet liv omtalt uten artsliste","godt nattdykk nevnt"].includes(text(item)));
}

export function diveFeatureWildlife(feature){
  const p=feature?.properties||{};
  const values=[
    ...splitWildlife(p.Observert_dyreliv),
    ...splitWildlife(p.Mulig_rapportert_dyreliv)
  ];
  const seen=new Set();
  return values.filter(item=>{
    const key=text(item);
    if(!key||seen.has(key))return false;
    seen.add(key);
    return true;
  });
}

export function diveWildlifeIndex(features,{minCount=1}={}){
  const counts=new Map();
  for(const feature of features||[]){
    for(const name of diveFeatureWildlife(feature)){
      const key=text(name);
      const entry=counts.get(key)||{key,label:name,count:0};
      entry.count+=1;
      if(name.length<entry.label.length)entry.label=name;
      counts.set(key,entry);
    }
  }
  return [...counts.values()]
    .filter(item=>item.count>=minCount)
    .sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,"no"));
}

export function diveDistanceKm(a,b){
  if([a?.lat,a?.lon,b?.lat,b?.lon].some(value=>value===null||value===undefined||value===""))return null;
  const lat1=Number(a.lat),lon1=Number(a.lon),lat2=Number(b.lat),lon2=Number(b.lon);
  if(![lat1,lon1,lat2,lon2].every(Number.isFinite)||Math.abs(lat1)>90||Math.abs(lat2)>90||Math.abs(lon1)>180||Math.abs(lon2)>180)return null;
  const rad=Math.PI/180,R=6371;
  const dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}

// The canonical research master is preserved. A recorded position is NOT
// treated as a verified map pin if its source notes explicitly disallow use.
// Keep records with unknown positions searchable but never invent coordinates.
const coordinateCaveat=/verifiser posisjon lokalt før bruk|ikke bruk koordinatet|eksakt plassering ikke etablert/i;
export function diveCoordinateAssessment(feature){
  const geometry=feature?.geometry;
  if(geometry===null||geometry===undefined)return {status:"missing",point:null};
  if(geometry.type!=="Point"||!Array.isArray(geometry.coordinates)||
    geometry.coordinates.length!==2)return {status:"invalid",point:null};
  const [lon,lat]=geometry.coordinates;
  if(typeof lon!=="number"||typeof lat!=="number"||
    !Number.isFinite(lon)||!Number.isFinite(lat)||
    Math.abs(lat)>90||Math.abs(lon)>180||
    (lat===0&&lon===0))return {status:"invalid",point:null};
  const p=feature?.properties||{};
  // An inconsistent duplicated position field must not silently override the
  // authoritative GeoJSON geometry or be shown as a verified point.
  if(p.Lat!==null&&p.Lat!==undefined&&p.Lon!==null&&p.Lon!==undefined){
    const otherLat=Number(p.Lat),otherLon=Number(p.Lon);
    if(!Number.isFinite(otherLat)||!Number.isFinite(otherLon)||
      Math.abs(otherLat-lat)>1e-6||Math.abs(otherLon-lon)>1e-6)
      return {status:"invalid",point:null};
  }
  if(coordinateCaveat.test(String(p.Notater||"")))
    return {status:"unverified",point:null};
  return {status:"mapped",point:{lat,lon}};
}
export function diveFeaturePoint(feature){
  return diveCoordinateAssessment(feature).point;
}

export function diveSourceUrls(properties){
  const urls=Array.isArray(properties?.source_urls)?properties.source_urls:[];
  return urls.filter(value=>{
    if(typeof value!=="string")return false;
    try{
      const url=new URL(value);
      return (url.protocol==="https:"||url.protocol==="http:")&&
        Boolean(url.hostname)&&!url.username&&!url.password;
    }catch{return false}
  });
}

export function filterDiveFeatures(features,{query="",level="all",kind="all",quality="all",maxDepth="",wildlife="all",excludeWildlife=false}={}){
  const q=text(query).trim();
  const depthLimit=maxDepth===""?null:Number(maxDepth);
  const wildlifeKey=text(wildlife);
  return (features||[]).filter(feature=>{
    const p=feature.properties||{};
    if(level!=="all"&&diveFeatureLevel(feature)!==level)return false;
    if(kind!=="all"&&diveFeatureKind(feature)!==kind)return false;
    if(quality!=="all"&&diveFeatureQuality(feature)!==quality)return false;
    const depth=diveFeatureMaxDepth(feature);
    if(Number.isFinite(depthLimit)&&depthLimit>=0&&depth!==null&&depth>depthLimit)return false;
    if(wildlife!=="all"){
      const matches=diveFeatureWildlife(feature).some(name=>text(name).includes(wildlifeKey));
      if(excludeWildlife?matches:!matches)return false;
    }
    if(q){
      const hay=text([p.Navn,p.Område,p.Kategori,p.Status,p.Observert_dyreliv,p.Mulig_rapportert_dyreliv,p.Vrak_historie,p.Notater].join(" "));
      if(!hay.includes(q))return false;
    }
    return true;
  });
}

export function sortDiveFeatures(features,mode="name",{origin=null}={}){
  const list=[...(features||[])];
  if(mode==="depth")return list.sort((a,b)=>(diveFeatureMaxDepth(a)??Infinity)-(diveFeatureMaxDepth(b)??Infinity)||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
  if(mode==="level"){
    const rank={P1:1,P2:2,P3:3,TECH:4,UNKNOWN:5};
    return list.sort((a,b)=>rank[diveFeatureLevel(a)]-rank[diveFeatureLevel(b)]||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
  }
  if(mode==="quality"){
    const rank={A:1,B:2,C:3,UNKNOWN:4};
    return list.sort((a,b)=>rank[diveFeatureQuality(a)]-rank[diveFeatureQuality(b)]||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
  }
  if(mode==="nearest"&&origin){
    return list.sort((a,b)=>{
      const da=diveDistanceKm(origin,diveFeaturePoint(a));
      const db=diveDistanceKm(origin,diveFeaturePoint(b));
      return (da??Infinity)-(db??Infinity)||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no");
    });
  }
  return list.sort((a,b)=>String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
}

export function diveStats(features){
  const list=features||[];
  return {
    total:list.length,
    wrecks:list.filter(f=>diveFeatureKind(f)==="wreck").length,
    nature:list.filter(f=>diveFeatureKind(f)==="nature").length,
    withDepth:list.filter(f=>diveFeatureMaxDepth(f)!==null).length,
    withCoordinates:list.filter(f=>diveFeaturePoint(f)!==null).length,
    unverifiedCoordinates:list.filter(f=>diveCoordinateAssessment(f).status==="unverified").length,
    withWildlife:list.filter(f=>diveFeatureWildlife(f).length>0).length
  };
}
