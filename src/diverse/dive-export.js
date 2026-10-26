import {diveCoordinateAssessment,diveSourceUrls} from "./dive-core.js?v=6b7381dcbab4670e27848d87c263d50b106c2935";

function publicDiveFeature(feature){
  // Never silently turn source-disclaimed or invalid coordinates into
  // navigation-ready points in CSV/GeoJSON exports.
  const safe=JSON.parse(JSON.stringify(feature));
  const assessment=diveCoordinateAssessment(feature);
  safe.properties=safe.properties||{};
  safe.properties.source_urls=diveSourceUrls(safe.properties);
  if(assessment.status!=="mapped"){
    safe.geometry=null;
    safe.properties.Lat=null;
    safe.properties.Lon=null;
    safe.properties.location_status=assessment.status;
  }
  return safe;
}

function csvCell(value){
  if(value===null||value===undefined)return "";
  let text=Array.isArray(value)?value.join(" | "):String(value);
  // Reject spreadsheet formula execution when exported CSV is opened in Excel.
  // Numeric data (including legitimate negative numbers) is unaffected.
  if(typeof value!=="number"&&/^\s*[=+@-]/.test(text))text="'"+text;
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
    const safe=publicDiveFeature(feature);
    const p=safe.properties||{};
    const coords=safe.geometry?.type==="Point"?safe.geometry.coordinates:[null,null];
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
  // Export only documented filter/source metadata. GPS origin is intentionally
  // excluded even if a caller accidentally includes it in an input object.
  const filters={};
  for(const key of ["query","level","kind","quality","maxDepth","sort","wildlife","excludeWildlife"]){
    if(Object.hasOwn(metadata.filters||{},key))filters[key]=metadata.filters[key];
  }
  return JSON.stringify({
    type:"FeatureCollection",
    metadata:{
      exportedAt:new Date().toISOString(),
      source:metadata.source??null,
      sourceDate:metadata.sourceDate??null,
      filters,
      publicExport:true,
      records:(features||[]).length
    },
    features:(features||[]).map(publicDiveFeature)
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
