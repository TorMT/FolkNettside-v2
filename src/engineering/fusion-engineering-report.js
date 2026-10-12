const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const fmt=(value,d=3)=>Number.isFinite(value)?value.toLocaleString("en-US",{
  maximumFractionDigits:d
}):"Unknown";

/** Display physical properties with strictly labeled CAD-data provenance. */
export function fusionEngineeringReportHTML(info){
 if(!info?.total||!Array.isArray(info.occurrences))
   throw Error("Fusion physical-property report is missing");
 const t=info.total,com=t.centerOfMassM;
 const rows=info.occurrences.slice(0,80).map(o=>
   '<tr><td>'+esc(o.fullPath||o.name)+'</td>'+
   '<td>'+fmt(o.massKg,3)+'</td><td>'+fmt(o.solidVolumeM3,6)+
   '</td><td>'+o.centerOfMassM.map(c=>fmt(c,3)).join(" / ")+'</td></tr>').join("");
 return '<section class="fusion-engineering-report" aria-label="Fusion source physical properties">'+
  '<header><strong>Fusion API · physical measurements</strong>'+
  '<span>Source: '+esc(info.sourceFile)+' · '+esc(info.exportedAt||"date unavailable")+'</span></header>'+
  '<div class="fusion-engineering-numbers">'+
  '<div><span>Assembly mass (Fusion materials)</span><strong>'+fmt(t.massKg,3)+' kg</strong></div>'+
  '<div><span>Solid material volume</span><strong>'+fmt(t.solidVolumeM3,6)+' m³</strong></div>'+
  (Number.isFinite(t.surfaceAreaM2)?
    '<div><span>CAD body surface area</span><strong>'+fmt(t.surfaceAreaM2,3)+' m²</strong></div>':"")+
  (t.boundsM?'<div><span>Model XYZ envelope (axis-aligned)</span><strong>'+
    t.boundsM.min.map((n,i)=>fmt(t.boundsM.max[i]-n,3)).join(' × ')+
    ' m</strong></div>':"")+
  '<div><span>Center of mass X / Y / Z</span><strong>'+com.map(c=>fmt(c,3)).join(' / ')+' m</strong></div>'+
  '<div><span>Assembly occurrences</span><strong>'+info.occurrences.length+'</strong></div></div>'+
  '<p class="fusion-data-scope"><strong>Measured in Fusion, not calculated from STEP triangles.</strong> '+
  'Assembly mass depends on correctly assigned material density. Solid volume is NOT the '+ 
  'underwater displaced volume, and the model is NOT yet a verified pressure hull or structural EI model.</p>'+
  (info.occurrences.length?'<details><summary>Occurrence breakdown (do not sum nested aggregates)</summary>'+
    '<div class="fusion-engineering-table"><table><thead><tr><th>Occurrence path</th>'+
    '<th>Mass (kg)</th><th>Solid volume (m³)</th><th>COM X / Y / Z (m)</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>'+
    (info.occurrences.length>80?'<small>Showing first 80 occurrences.</small>':'')+
    '</details>':'')+
  '<small>The STEP assembly is tessellated for 3D viewing. Verify units, component references, '+ 
  'orientation and hull watertightness before engineering calculations. If occurrences '+ 
  'contain child occurrences, their mass summaries overlap; only the top-level total is valid.</small>'+
  '</section>';
}
