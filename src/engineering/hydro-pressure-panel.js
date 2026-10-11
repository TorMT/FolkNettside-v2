/**
 * Read-only pressure audit visualization.
 * Positive vertical force is upwards, negative is downwards.
 * Station contributions are force-centroid histograms, not exact strip clipping.
 */
const format=(x,dec=3)=>Number.isFinite(x)?x.toLocaleString("en-US",{
 maximumFractionDigits:dec,minimumFractionDigits:dec
}):"—";
const escape=v=>String(v??"").replace(/[&<>"']/g,ch=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
export function hydroPressureResultHTML(pressure){
  if(!pressure?.crossCheck||!Array.isArray(pressure.strips))
    throw new Error("Missing pressure integration results");
  const check=pressure.crossCheck;
  const totalKN=pressure.forceN[2]/1000;
  const maxBar=Math.max(1,...pressure.strips.map(c=>Math.abs(c.forceZKN)));
  const width=650,height=180,pad=28;
  const x=i=>pad+i*(width-2*pad)/pressure.strips.length;
  const baseline=88,amplitude=64,dx=(width-2*pad)/pressure.strips.length;
  const bars=pressure.strips.map((entry,i)=>{
    const amount=entry.forceZKN/maxBar*amplitude;
    const top=amount>=0?baseline-amount:baseline;
    return '<rect x="'+(x(i)+1).toFixed(2)+'" y="'+top.toFixed(2)+
      '" width="'+Math.max(1,dx-2).toFixed(2)+'" height="'+Math.abs(amount).toFixed(2)+
      '" fill="'+(amount>=0?'var(--accent)':'var(--danger)')+'"/>';
  }).join("");
  const svg='<svg viewBox="0 0 '+width+' '+height+'" role="img" '+
    'aria-label="Vertical hydrodynamic pressure-force contributions versus longitudinal position X">'+
    '<path d="M'+pad+' '+baseline+'H'+(width-pad)+
    '" stroke="var(--line-strong)" stroke-width="1.5"/>'+
    bars+
    '<text x="'+pad+'" y="163" font-size="11" fill="var(--ink-2)">'+
    format(pressure.strips[0]?.x0,2)+' m</text>'+
    '<text x="'+(width-pad)+'" y="163" font-size="11" text-anchor="end" fill="var(--ink-2)">'+
    format(pressure.strips.at(-1)?.x1,2)+' m</text>'+
    '<text x="'+pad+'" y="15" font-size="11" fill="var(--ink-2)">X-station contributions · +Fz upward</text>'+
    '</svg>';
  const ok=check.passed;
  const maxForce=Math.max(...check.forceErrorN.map(Math.abs),0);
  const maxMoment=Math.max(...check.momentErrorNm.map(Math.abs),0);
  return '<article class="hydro-pressure-report" aria-label="Integrated hull pressure audit">'+
    '<h4>Integrated pressure over wetted hull triangles</h4>'+
    '<p class="hydro-pressure-audit '+(ok?'passed':'failed')+'" role="status">'+
      (ok?'PASS · pressure integration agrees with volume and CB':
        'REVIEW REQUIRED · pressure integration does not agree with volume / CB')+'</p>'+
    '<div class="hydro-pressure-stats">'+
      '<div><span>Integrated vertical pressure force</span><strong>'+format(totalKN,3)+' kN</strong></div>'+
      '<div><span>Expected ρgV buoyancy</span><strong>'+format(pressure.reference.forceN[2]/1000,3)+' kN</strong></div>'+
      '<div><span>Maximum face gauge pressure</span><strong>'+
        format(pressure.peakGaugePressurePa/1000,2)+' kPa</strong></div>'+
      '<div><span>Submerged wetted surface</span><strong>'+
        format(pressure.wetAreaM2,2)+' m²</strong></div>'+
      '<div><span>Largest force discrepancy</span><strong>'+
        format(maxForce,4)+' N</strong></div>'+
      '<div><span>Largest moment discrepancy</span><strong>'+
        format(maxMoment,3)+' N·m</strong></div>'+
    '</div>'+
    '<div class="hydro-pressure-histogram">'+svg+'</div>'+
    '<p class="muted">Forces are integrated analytically on every submerged planar mesh triangle. '+
    'Bars group triangle contributions by the pressure centroid X; their widths do not represent exact station-wise clipping. '+
    'This is NOT a longitudinal hull-girder FEM, structural stress result or surface certification.</p>'+
    '<details><summary>Numerical audit and component contributions</summary>'+
    '<p>Force tolerance ±'+format(check.forceToleranceN,4)+' N; moment tolerance ±'+
    format(check.momentToleranceNm,3)+' N·m. '+
    'Integrated F = ('+pressure.forceN.map(v=>format(v/1000,4)).join(', ')+') kN. '+
    'Integrated M = ('+pressure.momentNm.map(v=>format(v/1000,4)).join(', ')+') kN·m.</p>'+
    '<p>Processed '+format(pressure.sourceTriangleCount,0)+' source triangles, '+
      format(pressure.wetTriangles,0)+' wetted clipped triangles.</p>'+
    '<table><thead><tr><th>Component</th><th>Fz (kN)</th><th>Wet area (m²)</th></tr></thead><tbody>'+
    pressure.components.slice(0,30).map(c=>
      '<tr><td>'+escape(c.name)+'</td><td>'+format(c.forceN[2]/1000,3)+
      '</td><td>'+format(c.wetAreaM2,2)+'</td></tr>').join("")+'</tbody></table></details>'+
    '</article>';
}
