import {initialStability} from "../hydro/stability.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd";
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

function gzSVG(curve){
  if(!curve?.length)return "";
  const width=420,height=170,pad=28;
  const xs=curve.map(point=>point.heelDeg);
  const ys=curve.map(point=>point.gz);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const maxAbs=Math.max(...ys.map(value=>Math.abs(value)),.01);
  const sx=x=>pad+(x-minX)/Math.max(maxX-minX,1e-9)*(width-pad*2);
  const sy=y=>height/2-y/maxAbs*(height/2-pad);
  const points=curve.map(point=>`${sx(point.heelDeg).toFixed(1)},${sy(point.gz).toFixed(1)}`).join(" ");
  return `<div class="gz-curve">
    <div class="hydro-curve-head"><span>GZ / righting arm</span><span class="muted">${curve.length} constant-displacement points</span></div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="GZ righting arm curve">
      <path d="M${pad} ${height/2}H${width-pad}M${sx(0)} ${pad}V${height-pad}" stroke="var(--line-strong)" fill="none"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="3"/>
    </svg>
    <div class="gz-curve-meta"><span>${minX}°</span><span>0°</span><span>${maxX}°</span></div>
  </div>`;
}

export function hydroPanelHTML({
  modelDocument,
  result,
  curve,
  solved=null,
  solveError=null,
  draft,
  targetDisplacementTonnes="",
  kg="",
  lcg="",
  tcg="",
  heel=0,
  trim=0,
  gz=null,
  gzError=null,
  attitude=null,
  attitudeError=null,
  attitudeAction="",
  geometryWarnings=[],
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
  const stability=initialStability(result,{kg});

  return {
    inspector:`
      <h3>Hydro case</h3>
      <label class="field"><span>Draft / waterline</span><div><input id="hydro-draft" type="number" min="${minDraft}" max="${maxDraft}" step="0.05" value="${clamped.toFixed(2)}"><span> m</span></div></label>
      <div class="readout"><span>Water density</span><strong>${density} kg/m³</strong></div>
      <div class="readout"><span>Source</span><strong>${esc(modelDocument.name)}</strong></div>
      <div class="readout"><span>Included geometry</span><strong>${result.components.length} component(s)</strong></div>
      <div class="hydro-solver">
        <div class="hydro-section-label">Loading condition</div>
        <label class="field"><span>Target displacement</span><div><input id="hydro-target" type="number" min="0" step="0.1" value="${esc(targetDisplacementTonnes)}"><span> t</span></div></label>
        <button class="btn" id="hydro-solve">Solve draft</button>
        ${solvedText?`<p class="hydro-solve-result">Draft: <strong>${solvedText}</strong></p>`:""}
        ${solveError?`<p class="hydro-solve-error">${esc(solveError)}</p>`:""}

        <div class="hydro-section-label">Centre of gravity</div>
        <div class="hydro-cg-grid">
          <label><span>LCG · x</span><input id="hydro-lcg" type="number" step="0.01" value="${esc(lcg)}" placeholder="0"></label>
          <label><span>TCG · y</span><input id="hydro-tcg" type="number" step="0.01" value="${esc(tcg)}" placeholder="0"></label>
          <label><span>KG · z</span><input id="hydro-kg" type="number" step="0.01" value="${esc(kg)}" placeholder="required"></label>
        </div>

        <div class="hydro-section-label">Attitude</div>
        <div class="hydro-attitude-grid">
          <label><span>Heel</span><div><input id="hydro-heel" type="number" step="0.5" value="${esc(heel)}"><span>°</span></div></label>
          <label><span>Trim</span><div><input id="hydro-trim" type="number" step="0.25" value="${esc(trim)}"><span>°</span></div></label>
        </div>
        <div class="hydro-action-grid">
          <button class="btn" id="hydro-attitude" ${kg===""?"disabled":""}>Analyze attitude</button>
          <button class="btn" id="hydro-gz" ${kg===""?"disabled":""}>GZ curve</button>
          <button class="btn" id="hydro-equilibrium-heel" ${kg===""?"disabled":""}>Solve heel</button>
          <button class="btn" id="hydro-equilibrium-trim" ${kg===""?"disabled":""}>Solve trim</button>
        </div>
        ${gzError?`<p class="hydro-solve-error">${esc(gzError)}</p>`:""}
        ${attitudeError?`<p class="hydro-solve-error">${esc(attitudeError)}</p>`:""}
        ${attitude?`<div class="hydro-attitude-result">
          <strong>${attitudeAction==="heelEq"?"Heel equilibrium":attitudeAction==="trimEq"?"Trim equilibrium":"Attitude result"}</strong>
          <span>heel ${Number(attitude.heelDeg).toFixed(3)}° · trim ${Number(attitude.trimDeg).toFixed(3)}°</span>
          <span>draft ${Number(attitude.waterline).toFixed(4)} m · CB (${attitude.centerOfBuoyancy.map(v=>Number(v).toFixed(3)).join(", ")}) m</span>
          <span>roll arm ${Number(attitude.rollLever).toFixed(5)} m · pitch arm ${Number(attitude.pitchLever).toFixed(5)} m</span>
          ${Number.isFinite(Number(attitude.equilibriumAngle))?`<span>equilibrium ${Number(attitude.equilibriumAngle).toFixed(4)}° · residual ${Number(attitude.residual).toExponential(2)} m</span>`:""}
        </div>`:""}
      </div>
      ${geometryWarnings.length?`<div class="geometry-warning"><strong>Geometry warning</strong><span>${geometryWarnings.length} included component(s) are not watertight. Hydro results may be invalid.</span></div>`:""}
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
        ${stability.valid?`
          <div><span class="muted">BM transverse</span><strong>${stability.bmTransverse.toFixed(3)} m</strong></div>
          <div><span class="muted">BM longitudinal</span><strong>${stability.bmLongitudinal.toFixed(3)} m</strong></div>
          <div><span class="muted">KM transverse</span><strong>${stability.kmTransverse.toFixed(3)} m</strong></div>
          <div><span class="muted">KM longitudinal</span><strong>${stability.kmLongitudinal.toFixed(3)} m</strong></div>
          ${stability.gmTransverse===null?"":`<div><span class="muted">GM transverse</span><strong>${stability.gmTransverse.toFixed(3)} m</strong></div>`}
          ${stability.gmLongitudinal===null?"":`<div><span class="muted">GM longitudinal</span><strong>${stability.gmLongitudinal.toFixed(3)} m</strong></div>`}
        `:""}
      </div><p class="muted hydro-stability-note">BM/KM/GM are initial small-angle stability values. GZ solves a new waterline at constant displacement for every heel angle.</p>${gzSVG(gz)}${curveSVG(curve)}</div>
    `,
    draft:clamped,
    density,
    waterlinePercent:((clamped-minDraft)/span)*100
  };
}
