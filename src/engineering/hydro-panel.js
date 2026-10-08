import {hydrostaticCurveRows,hydrostaticParticulars} from "../hydro/stability.js";
import {gzMetrics} from "../hydro/gz.js";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

export function hydroPreflightHTML(validation){
  if(!validation)return "";
  const heading=validation.passed?"Mesh preflight passed":"Hydro blocked: hull mesh failed validation";
  const entries=(validation.components||[]).map(item=>{
    const m=item.metrics;
    const counts=m?`<span>${m.triangleCount} triangles · ${m.boundaryEdges} open edges · ${m.nonManifoldEdges} non-manifold · ${m.windingConflicts} winding conflicts${m.selfIntersections!==null&&m.selfIntersections!==undefined?` · ${m.selfIntersections} triangle collisions`:""}${m.edgeConnectedShells!==null&&m.edgeConnectedShells!==undefined?` · ${m.edgeConnectedShells} edge-connected shells`:""}</span>`:"";
    return `<li><strong>${esc(item.name||item.componentId)}</strong>
      ${counts}
      ${item.errors.length?`<ul>${item.errors.map(error=>`<li>${esc(error)}</li>`).join("")}</ul>`:""}</li>`;
  }).join("");
  return `<section class="hydro-preflight ${validation.passed?"hydro-preflight-pass":"hydro-preflight-fail"}" aria-label="Hull geometry preflight">
    <strong>${heading}</strong>
    <p>${validation.passed?"Selected triangles satisfy basic closure and orientation checks. This is not validation of real hull provenance, datum, intersections or loading condition.":"No hydrostatic displacement, GM, GZ or trim/heel results are calculated until the selected hull geometry is repaired."}</p>
    ${entries?`<details ${validation.passed?"":"open"}><summary>Geometry diagnostics (${validation.components.length} component(s))</summary><ul>${entries}</ul></details>`:""}
    ${validation.errors.length&&!entries?`<ul>${validation.errors.map(error=>`<li>${esc(error)}</li>`).join("")}</ul>`:""}
  </section>`;
}

function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0))}
function fmt(value,digits=3){
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(digits):"—";
}

function hydroCurveSVG(rows,key,title,unit,{digits=2}={}){
  const values=(rows||[]).map(row=>({x:Number(row.draft),y:Number(row[key])}))
    .filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
  if(values.length<2)return "";
  const width=320,height=116,pad={l:34,r:10,t:18,b:24};
  const minX=Math.min(...values.map(p=>p.x)),maxX=Math.max(...values.map(p=>p.x));
  let minY=Math.min(...values.map(p=>p.y)),maxY=Math.max(...values.map(p=>p.y));
  if(Math.abs(maxY-minY)<1e-12){const d=Math.max(1,Math.abs(maxY)*.1);minY-=d;maxY+=d}
  const yPad=(maxY-minY)*.08;minY-=yPad;maxY+=yPad;
  const sx=x=>pad.l+(x-minX)/Math.max(maxX-minX,1e-9)*(width-pad.l-pad.r);
  const sy=y=>height-pad.b-(y-minY)/Math.max(maxY-minY,1e-9)*(height-pad.t-pad.b);
  const points=values.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const mid=(minY+maxY)/2;
  return `<div class="hydro-curve hydro-particular-curve">
    <div class="hydro-curve-head"><span>${title}</span><span class="muted">${unit}</span></div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)} versus draft">
      <path d="M${pad.l} ${height-pad.b}H${width-pad.r}M${pad.l} ${pad.t}V${height-pad.b}" stroke="var(--line-strong)" fill="none"/>
      <path d="M${pad.l} ${sy(mid)}H${width-pad.r}" stroke="var(--line)" fill="none"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      <text x="${pad.l-5}" y="${sy(maxY)+4}" text-anchor="end" fill="var(--ink-3)" font-size="8">${fmt(maxY,digits)}</text>
      <text x="${pad.l-5}" y="${sy(minY)+4}" text-anchor="end" fill="var(--ink-3)" font-size="8">${fmt(minY,digits)}</text>
      <text x="${pad.l}" y="${height-6}" fill="var(--ink-3)" font-size="8">${fmt(minX,2)} m</text>
      <text x="${width-pad.r}" y="${height-6}" text-anchor="end" fill="var(--ink-3)" font-size="8">${fmt(maxX,2)} m</text>
    </svg>
  </div>`;
}

function hydrostaticCurvesHTML(rows,{hasKg=false}={}){
  if(!rows?.length)return "";
  return `<div class="hydro-particular-curves">
    ${hydroCurveSVG(rows,"displacementTonnes","Displacement","t",{digits:1})}
    ${hydroCurveSVG(rows,"waterplaneArea","Waterplane area","m²",{digits:1})}
    ${hydroCurveSVG(rows,"kb","KB","m",{digits:2})}
    ${hydroCurveSVG(rows,hasKg?"gmTransverse":"kmTransverse",hasKg?"GM transverse":"KM transverse","m",{digits:2})}
  </div>`;
}

function hydrostaticTableHTML(rows,{hasKg=false}={}){
  if(!rows?.length)return "";
  const selected=rows.filter((_,index)=>index===0||index===rows.length-1||index%Math.max(1,Math.floor(rows.length/6))===0);
  return `<div class="hydro-table-wrap">
    <div class="hydro-curve-head"><span>Hydrostatic table</span><span class="muted">${rows.length} calculated drafts</span></div>
    <table class="hydro-table">
      <thead><tr>
        <th>Draft m</th><th>Disp. t</th><th>Aw m²</th><th>LCB m</th><th>KB m</th><th>LCF m</th><th>TPC t/cm</th><th>${hasKg?"GMt":"KMt"} m</th>
      </tr></thead>
      <tbody>${selected.map(row=>`<tr>
        <td>${fmt(row.draft,2)}</td><td>${fmt(row.displacementTonnes,1)}</td><td>${fmt(row.waterplaneArea,2)}</td>
        <td>${fmt(row.lcb,2)}</td><td>${fmt(row.kb,2)}</td><td>${fmt(row.lcf,2)}</td>
        <td>${fmt(row.tonnesPerCm,3)}</td><td>${fmt(hasKg?row.gmTransverse:row.kmTransverse,2)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`;
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
  hydroValidation=null,
  config={}
}){
  const density=Number(config.density)||1025;
  const minDraft=Number.isFinite(Number(config.minDraft))?Number(config.minDraft):0;
  const maxDraft=Number.isFinite(Number(config.maxDraft))?Number(config.maxDraft):10;
  const clamped=clamp(draft,minDraft,maxDraft);
  const cb=result.centerOfBuoyancy;
  const span=Math.max(maxDraft-minDraft,1e-9);
  const solvedText=solved?`${solved.waterline.toFixed(4)} m (${solved.iterations} iterations)`:null;
  const hasKg=kg!==""&&Number.isFinite(Number(kg));
  const particulars=hydrostaticParticulars(result,{density,kg:hasKg?Number(kg):null});
  const curveRows=hydrostaticCurveRows(curve,{density,kg:hasKg?Number(kg):null});
  const gzSummary=gzMetrics(gz);

  return {
    inspector:`
      <h3>Hydro case</h3>
      ${hydroPreflightHTML(hydroValidation)}
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
      <div class="readout"><span>Volume</span><strong>${particulars.volume.toFixed(3)} m³</strong></div>
      <div class="readout"><span>Displacement</span><strong>${particulars.displacementTonnes.toFixed(2)} t</strong></div>
      <div class="readout"><span>KB</span><strong>${particulars.kb.toFixed(3)} m</strong></div>
      <div class="readout"><span>TPC</span><strong>${particulars.tonnesPerCm.toFixed(3)} t/cm</strong></div>
    `,
    results:`
      <div class="hydro-results-wrap">
        <div class="hydro-grid hydro-particular-grid">
          <div><span class="muted">CB / LCB · TCB · KB</span><strong>(${cb.map(v=>v.toFixed(3)).join(", ")}) m</strong></div>
          <div><span class="muted">Waterplane area</span><strong>${particulars.waterplaneArea.toFixed(3)} m²</strong></div>
          <div><span class="muted">LCF</span><strong>${particulars.lcf.toFixed(3)} m</strong></div>
          <div><span class="muted">TCF</span><strong>${particulars.tcf.toFixed(3)} m</strong></div>
          <div><span class="muted">TPC</span><strong>${particulars.tonnesPerCm.toFixed(3)} t/cm</strong></div>
          <div><span class="muted">Ixx</span><strong>${particulars.ixx.toFixed(3)} m⁴</strong></div>
          <div><span class="muted">Iyy</span><strong>${particulars.iyy.toFixed(3)} m⁴</strong></div>
          <div><span class="muted">Ixy</span><strong>${particulars.ixy.toFixed(3)} m⁴</strong></div>
          <div><span class="muted">Principal I max / min</span><strong>${particulars.principalMomentMajor.toFixed(3)} / ${particulars.principalMomentMinor.toFixed(3)} m⁴</strong></div>
          <div><span class="muted">Principal axis</span><strong>${particulars.principalAxisDeg.toFixed(2)}° from +x</strong></div>
          <div><span class="muted">Principal BM max / min</span><strong>${particulars.principalBmMajor.toFixed(3)} / ${particulars.principalBmMinor.toFixed(3)} m</strong></div>
          ${particulars.valid?`
            <div><span class="muted">BM transverse</span><strong>${particulars.bmTransverse.toFixed(3)} m</strong></div>
            <div><span class="muted">BM longitudinal</span><strong>${particulars.bmLongitudinal.toFixed(3)} m</strong></div>
            <div><span class="muted">KM transverse</span><strong>${particulars.kmTransverse.toFixed(3)} m</strong></div>
            <div><span class="muted">KM longitudinal</span><strong>${particulars.kmLongitudinal.toFixed(3)} m</strong></div>
            ${particulars.gmTransverse===null?"":`<div><span class="muted">GM transverse</span><strong>${particulars.gmTransverse.toFixed(3)} m</strong></div>`}
            ${particulars.gmLongitudinal===null?"":`<div><span class="muted">GM longitudinal</span><strong>${particulars.gmLongitudinal.toFixed(3)} m</strong></div>`}
          `:""}
        </div>
        <div class="hydro-curves-column">
          <p class="muted hydro-stability-note">LCF/TCF are the waterplane centroid. TPC is tonnes per centimetre immersion. Principal waterplane moments account for non-zero Ixy on asymmetric waterplanes. BM/KM/GM are initial small-angle values; GZ resolves a new waterline at constant displacement for every heel angle.</p>
          ${gzSummary.valid?`<div class="gz-metrics">
            <div><span>Max GZ</span><strong>${fmt(gzSummary.maxGz,3)} m</strong></div>
            <div><span>Angle @ max</span><strong>${fmt(gzSummary.angleAtMaxGz,1)}°</strong></div>
            <div><span>Area +heel</span><strong>${fmt(gzSummary.areaPositiveMrad,3)} m·rad</strong></div>
            <div><span>GM from first GZ point</span><strong>${gzSummary.initialGmEstimate===null?"—":fmt(gzSummary.initialGmEstimate,3)+" m"}</strong></div>
          </div>`:""}
          ${gzSVG(gz)}
          ${hydrostaticCurvesHTML(curveRows,{hasKg})}
          ${hydrostaticTableHTML(curveRows,{hasKg})}
          <div class="hydro-export-row">
            <button class="btn" id="hydro-export-table" ${curveRows.length?"":"disabled"}>Export hydro CSV</button>
            <button class="btn" id="hydro-export-gz" ${gz?.length?"":"disabled"}>Export GZ CSV</button>
          </div>
        </div>
      </div>
    `,
    particulars,
    curveRows,
    gzSummary,
    draft:clamped,
    density,
    waterlinePercent:((clamped-minDraft)/span)*100
  };
}
