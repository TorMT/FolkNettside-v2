function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0))}
function curveSVG(curve){
  if(!curve?.length)return "";
  const width=360,height=130,pad=18;
  const xs=curve.map(p=>p.waterline),ys=curve.map(p=>p.volume);
  const minX=Math.min(...xs),maxX=Math.max(...xs),maxY=Math.max(...ys,1);
  const sx=x=>pad+(x-minX)/Math.max(maxX-minX,1e-9)*(width-pad*2);
  const sy=y=>height-pad-y/maxY*(height-pad*2);
  const points=curve.map(p=>`${sx(p.waterline).toFixed(1)},${sy(p.volume).toFixed(1)}`).join(" ");
  return `<div class="hydro-curve"><div class="hydro-curve-head"><span>Volume vs draft</span><span class="muted">${curve.length} samples</span></div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Hydrostatic volume curve">
      <path d="M${pad} ${height-pad}H${width-pad}M${pad} ${pad}V${height-pad}" stroke="var(--line-strong)" fill="none"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="3"/>
    </svg></div>`;
}

export function hydroPanelHTML({
  modelDocument,
  result,
  curve,
  solved=null,
  solveError=null,
  draft,
  targetDisplacementTonnes="",
  config={}
}){
  const density=Number(config.density)||1025;
  const minDraft=Number.isFinite(Number(config.minDraft))?Number(config.minDraft):0;
  const maxDraft=Number.isFinite(Number(config.maxDraft))?Number(config.maxDraft):10;
  const clamped=clamp(draft,minDraft,maxDraft);
  const cb=result.centerOfBuoyancy;
  const displacementTonnes=result.volume*density/1000;
  const span=Math.max(maxDraft-minDraft,1e-9);
  const solvedText=solved?`${solved.waterline.toFixed(4)} m (${solved.iterations} iterations)`:null;

  return {
    inspector:`
      <h3>Hydro case</h3>
      <label class="field"><span>Draft / waterline</span><div><input id="hydro-draft" type="number" min="${minDraft}" max="${maxDraft}" step="0.05" value="${clamped.toFixed(2)}"><span> m</span></div></label>
      <div class="readout"><span>Water density</span><strong>${density} kg/m³</strong></div>
      <div class="readout"><span>Source</span><strong>${esc(modelDocument.name)}</strong></div>
      <div class="readout"><span>Included geometry</span><strong>${result.components.length} component(s)</strong></div>
      <div class="hydro-solver">
        <label class="field"><span>Target displacement</span><div><input id="hydro-target" type="number" min="0" step="0.1" value="${esc(targetDisplacementTonnes)}"><span> t</span></div></label>
        <button class="btn" id="hydro-solve">Solve draft</button>
        ${solvedText?`<p class="hydro-solve-result">Draft: <strong>${solvedText}</strong></p>`:""}
        ${solveError?`<p class="hydro-solve-error">${esc(solveError)}</p>`:""}
      </div>
      <p class="muted hydro-note">Calculations run in a Web Worker from imported ModelDocument geometry in world-space metres.</p>
    `,
    summary:`
      <strong>Hydro summary</strong>
      <div class="readout"><span>Volume</span><strong>${result.volume.toFixed(3)} m³</strong></div>
      <div class="readout"><span>Displacement</span><strong>${displacementTonnes.toFixed(2)} t</strong></div>
      <div class="readout"><span>CB z</span><strong>${cb[2].toFixed(3)} m</strong></div>
    `,
    results:`
      <div class="hydro-results-wrap"><div class="hydro-grid">
        <div><span class="muted">CB</span><strong>(${cb.map(v=>v.toFixed(3)).join(", ")}) m</strong></div>
        <div><span class="muted">Waterplane area</span><strong>${result.waterplane.area.toFixed(3)} m²</strong></div>
        <div><span class="muted">Ixx</span><strong>${result.waterplane.ixx.toFixed(3)} m⁴</strong></div>
        <div><span class="muted">Iyy</span><strong>${result.waterplane.iyy.toFixed(3)} m⁴</strong></div>
      </div>${curveSVG(curve)}</div>
    `,
    draft:clamped,
    density,
    waterlinePercent:((clamped-minDraft)/span)*100
  };
}
