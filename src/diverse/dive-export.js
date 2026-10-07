function csvCell(value){
  if(value===null||value===undefined)return "";
  const text=Array.isArray(value)?value.join(" | "):String(value);
  return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}

export function diveFeaturesCSV(features=[]){
  const header=[
    "id","name","area","category","status","lat","lon","depth_min_m","depth_max_m",
    "source_level","data_quality","access","bottom_terrain","conditions_caveat",
    "observed_wildlife","reported_possible_wildlife","wreck_history","protection",
    "source_ids","source_urls","verified_date"
  ];
  const rows=(features||[]).map(feature=>{
    const p=feature?.properties||{};
    const coords=feature?.geometry?.type==="Point"?feature.geometry.coordinates:[null,null];
    return [
      p.ID||feature?.id||"",p.Navn,p.Område,p.Kategori,p.Status,
      coords?.[1]??"",coords?.[0]??"",p.Dybde_min_m,p.Dybde_max_m,p.Kilde_nivå,p.Datakvalitet,
      p.Adkomst,p.Bunn_terreng,p.Strøm_fare_forbehold,p.Observert_dyreliv,p.Mulig_rapportert_dyreliv,
      p.Vrak_historie,p.Vern_kulturminne,p.Kilde_IDer,p.source_urls,p.verified_date
    ].map(csvCell).join(",");
  });
  return [header.join(","),...rows].join("\n")+"\n";
}

export function diveFeaturesGeoJSON(features=[],metadata={}){
  return JSON.stringify({
    type:"FeatureCollection",
    metadata:{
      exportedAt:new Date().toISOString(),
      publicExport:true,
      records:(features||[]).length,
      ...metadata
    },
    features:(features||[]).map(feature=>JSON.parse(JSON.stringify(feature)))
  },null,2)+"\n";
}

export function downloadDiveText(text,filename,type){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
