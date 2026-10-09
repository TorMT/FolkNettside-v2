export function sacCurvePanelHTML(result){
 const rows=result?.stations||[];
 if(rows.length<3)return '<p>No sectional area observations.</p>';
 const max=Math.max(result.maximumSectionArea,1e-8),minX=rows[0].x,
   range=Math.max(rows.at(-1).x-minX,1e-9);
 const coords=rows.map(point=>{
   const x=32+(point.x-minX)/range*320;
   const y=166-point.area/max*132;
   return x.toFixed(2)+","+y.toFixed(2);
 }).join(" ");
 const num=n=>Number(n).toFixed(3);
 return `<section class="sac-results" aria-label="Sectional Area Curve">
 <div class="sac-stats"><strong>Sectional Area Curve (SAC)</strong>
 <span>Max area: ${num(result.maximumSectionArea)} m²</span>
 <span>Station-integrated volume: ${num(result.estimatedVolume)} m³</span></div>
 <svg viewBox="0 0 400 204" role="img" aria-label="Underwater cross sectional area along ship X at the selected waterline">
 <path d="M32 16V166H360" stroke="var(--ink-3)" stroke-width="1" fill="none"/>
 <polyline points="${coords}" stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
 <text x="32" y="194" font-size="11" fill="currentColor">${num(minX)} m</text>
 <text x="360" y="194" font-size="11" fill="currentColor" text-anchor="end">${num(rows.at(-1).x)} m</text>
 <text x="32" y="11" font-size="11" fill="currentColor">A(x), m²</text>
 </svg>
 <p class="muted">Approximate mesh slices at ${rows.length} stations, below z=${num(result.draft)} m. This is a geometry preview, not verified hydrostatic particulars.</p>
 <button type="button" class="btn" id="engineering-sac-export">Export SAC CSV</button>
 </section>`;
}
