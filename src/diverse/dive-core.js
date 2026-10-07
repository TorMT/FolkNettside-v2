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
  return category.includes("vrak")||category.includes("lekter")?"wreck":"nature";
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
export function filterDiveFeatures(features,{query="",level="all",kind="all",quality="all",maxDepth=""}={}){
  const q=text(query).trim();
  const depthLimit=maxDepth===""?null:Number(maxDepth);
  return (features||[]).filter(feature=>{
    const p=feature.properties||{};
    if(level!=="all"&&diveFeatureLevel(feature)!==level)return false;
    if(kind!=="all"&&diveFeatureKind(feature)!==kind)return false;
    if(quality!=="all"&&diveFeatureQuality(feature)!==quality)return false;
    const depth=diveFeatureMaxDepth(feature);
    if(Number.isFinite(depthLimit)&&depthLimit>=0&&depth!==null&&depth>depthLimit)return false;
    if(q){
      const hay=text([p.Navn,p.Område,p.Kategori,p.Status,p.Observert_dyreliv,p.Mulig_rapportert_dyreliv,p.Vrak_historie,p.Notater].join(" "));
      if(!hay.includes(q))return false;
    }
    return true;
  });
}
export function sortDiveFeatures(features,mode="name"){
  const list=[...(features||[])];
  if(mode==="depth")return list.sort((a,b)=>(diveFeatureMaxDepth(a)??Infinity)-(diveFeatureMaxDepth(b)??Infinity)||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
  if(mode==="level"){
    const rank={P1:1,P2:2,P3:3,TECH:4,UNKNOWN:5};
    return list.sort((a,b)=>rank[diveFeatureLevel(a)]-rank[diveFeatureLevel(b)]||String(a.properties?.Navn||"").localeCompare(String(b.properties?.Navn||""),"no"));
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
    withCoordinates:list.filter(f=>Array.isArray(f.geometry?.coordinates)&&f.geometry.coordinates.length>=2).length
  };
}
