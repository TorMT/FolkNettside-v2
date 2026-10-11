import {stressRGB,interpolateGirderAt} from "../structure/hull-contours.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const fmt=(value,dec=3)=>Number.isFinite(value)?Number(value).toFixed(dec):"—";
const rgb=(v,range)=>"rgb("+stressRGB(v,range).map(n=>Math.round(255*n)).join(",")+")";

export function hullGirderDiagram(girder,{metric="stress",width=880,height=285}={}){
  if(!girder?.field?.length)return "";
  const data=girder.field;
  const x0=girder.frame.nodes[0].x,x1=girder.frame.nodes.at(-1).x;
  const values=data.map(item=>metric==="deflection"?item.deflectionM:item.stressPa);
  const range=Math.max(1e-15,...values.map(Math.abs));
  const maxAbsStress=Math.max(1,Number(girder.maxStressPa)||0);
  const pad=42,cx=x=>pad+(x-x0)/(x1-x0)*(width-2*pad);
  const cy=v=>height/2-v/range*(height/2-50);
  const scale=metric==="stress"?1e-6:1000;
  const unit=metric==="stress"?"MPa":"mm";
  const points=data.map((item,i)=>[cx(item.x),cy(values[i])]);
  const segments=points.slice(1).map((p,i)=>{
    const prev=points[i],v=(values[i]+values[i+1])/2;
    return `<line x1="${prev[0].toFixed(2)}" y1="${prev[1].toFixed(2)}" x2="${p[0].toFixed(2)}" y2="${p[1].toFixed(2)}"
      stroke="${rgb(metric==="stress"?v:v/range*maxAbsStress,maxAbsStress)}" stroke-width="4" stroke-linecap="round"/>`;
  }).join("");
  const label=metric==="stress"?"Signed extreme-fibre bending stress":"Global vertical beam deflection";
  return `<svg class="hull-fem-diagram" viewBox="0 0 ${width} ${height}" role="img"
    aria-label="${esc(label)} along hull X, ${unit}">
    <line x1="${pad}" x2="${width-pad}" y1="${height/2}" y2="${height/2}" stroke="var(--line-strong)" stroke-dasharray="5 5"/>
    <text x="${pad}" y="19" fill="var(--ink-2)" font-size="12">${esc(label)} · ${unit}</text>
    <text x="${pad}" y="38" fill="var(--ink-3)" font-size="11">max ±${fmt(range*scale,3)} ${unit}</text>
    <text x="${pad}" y="${height-8}" fill="var(--ink-2)" font-size="11">X ${fmt(x0,2)} m</text>
    <text x="${width-pad}" y="${height-8}" fill="var(--ink-2)" text-anchor="end" font-size="11">X ${fmt(x1,2)} m</text>
    ${segments}
  </svg>`;
}
export function hullGirderLoadDiagram(girder,{width=880,height=245}={}){
  if(!girder?.lineLoads?.length)return "";
  const rows=girder.lineLoads;
  const xmin=girder.frame.nodes[0].x,xmax=girder.frame.nodes.at(-1).x;
  const scale=Math.max(1,...rows.flatMap(x=>[Math.abs(x.gravityQ),Math.abs(x.buoyancyQ)]));
  const axis=108,pad=44,w=width-2*pad,amplitude=75;
  const X=x=>pad+(x-xmin)/(xmax-xmin)*w;
  const pieces=rows.map(row=>{
    const x=X(row.from),dx=Math.max(.5,X(row.to)-x);
    const up=Math.max(0,row.buoyancyQ)/scale*amplitude;
    const down=Math.max(0,-row.gravityQ)/scale*amplitude;
    return '<rect x="'+x.toFixed(2)+'" y="'+(axis-up).toFixed(2)+
      '" width="'+dx.toFixed(2)+'" height="'+up.toFixed(2)+'" fill="var(--accent)" opacity=".75"/>'+
      '<rect x="'+x.toFixed(2)+'" y="'+axis+'" width="'+dx.toFixed(2)+
      '" height="'+down.toFixed(2)+'" fill="var(--danger)" opacity=".65"/>';
  }).join("");
  return '<svg class="hull-fem-load-chart" viewBox="0 0 '+width+' '+height+'" role="img" '+
    'aria-label="Signed longitudinal load: blue upward buoyancy, red downward gravity">'+
    '<path d="M'+pad+' '+axis+'H'+(width-pad)+'" stroke="var(--line-strong)" stroke-width="2"/>'+
    '<text x="'+pad+'" y="19" fill="var(--ink-2)" font-size="12">+ up · − down, qz (N/m)</text>'+
    '<text x="'+pad+'" y="34" fill="var(--accent)" font-size="11">Buoyancy</text>'+
    '<text x="'+(pad+90)+'" y="34" fill="var(--danger)" font-size="11">Gravity</text>'+
    pieces+
    '<text x="'+pad+'" y="'+(height-13)+'" fill="var(--ink-2)" font-size="11">X '+fmt(xmin,2)+' m</text>'+
    '<text x="'+(width-pad)+'" y="'+(height-13)+'" text-anchor="end" fill="var(--ink-2)" font-size="11">X '+fmt(xmax,2)+' m</text>'+
    '</svg>';
}
function buoyancySummaryHTML(result){
  if(!result?.buoyancyTransfer)return "";
  return '<div class="readout"><span>Integrated buoyancy</span><strong>'+
    fmt(result.buoyancyForceN/1000,3)+' kN ↑</strong></div>'+
    '<div class="readout"><span>Gravity</span><strong>'+
    fmt(-result.gravityForceN/1000,3)+' kN ↓</strong></div>'+
    '<div class="readout"><span>Net pressure + weight (before supports)</span><strong>'+
    fmt(result.verticalLoadN/1000,3)+' kN</strong></div>'+
    '<div class="readout"><span>Support reactions (numerical fixture)</span><strong>'+
    fmt(result.reactionN/1000,3)+' kN</strong></div>';
}
export function hullGirderPanelHTML({caseInput={},result=null,error="",modelName="",bounds}={}){
  const values={
    hullMassTonnes:caseInput.hullMassTonnes??"",
    cg:caseInput.cg||[0,0,0],pointText:caseInput.pointText||"",
    areaText:caseInput.areaText||"",
    eGpa:caseInput.eGpa??210,iM4:caseInput.iM4??"",
    extremeFiberM:caseInput.extremeFiberM??"",segments:caseInput.segments??12,
    neutralZ:caseInput.neutralZ??0,
    loadingMode:caseInput.loadingMode||"gravity-only",
    supportModel:caseInput.supportModel||"pinned-roller",
    pressureDraft:caseInput.pressureDraft??1,
    pressureDensity:caseInput.pressureDensity??1025,
    pressureSections:caseInput.pressureSections??12
  };
  const summary=result?`
    <strong>Global girder · ${result.buoyancyTransfer?"pressure + gravity":"gravity-only fixture"}</strong>
    <div class="readout"><span>Mass (including loads)</span><strong>${fmt(result.loading.totalMassTonnes,2)} t</strong></div>
    <div class="readout"><span>Peak |σx| · beam fibre</span><strong>${fmt(result.maxStressPa/1e6,2)} MPa</strong></div>
    <div class="readout"><span>Peak deflection</span><strong>${fmt(result.maxDeflectionM*1000,3)} mm</strong></div>
    <div class="readout"><span>Max bending moment</span><strong>${fmt(result.maxMomentNm/1000,2)} kN·m</strong></div>
    <div class="readout"><span>Force equilibrium error</span><strong>${fmt(result.equilibriumResidualN,5)} N</strong></div>
    ${buoyancySummaryHTML(result)}`:
    `<strong>Global girder study · inputs required</strong>
      <p class="muted">Assign measured hull mass, E, structural I and neutral-axis distance. Geometry alone cannot determine structural stiffness.</p>`;
  const inspector=`
    <h3>Global hull girder · declared structural beam model</h3>
    <p class="muted">Longitudinal Euler–Bernoulli beam with manually entered stiffness and explicit supports. Pressure transfer is available for hydro-qualified imported hull meshes. This is NOT plate/shell FEA.</p>
    <label class="field"><span>Hull mass, t (excluding added loads)</span>
      <input id="girder-hull-mass" type="number" min=".001" step=".1" value="${esc(values.hullMassTonnes)}" placeholder="required"></label>
    <div class="hydro-cg-grid">
      ${["x","y","z"].map((v,i)=>`<label><span>Hull CG ${v}, m</span>
        <input id="girder-cg-${v}" type="number" step=".01" value="${esc(values.cg[i])}"></label>`).join("")}
    </div>
    <label class="field"><span>Additional point masses · t, x, y, z per row</span>
      <textarea id="girder-points" rows="3" spellcheck="false" placeholder="1, 2, 0, 1">${esc(values.pointText)}</textarea></label>
    <label class="field"><span>Uniform deck mass loads · t/m², x0, x1, y0, y1, z</span>
      <textarea id="girder-areas" rows="3" spellcheck="false" placeholder="0.25, 2, 5, -1, 1, 2">${esc(values.areaText)}</textarea></label>
    <details class="load-sketch-panel"><summary>Draw area and point mass loads · hull plan</summary><div id="girder-load-sketch"></div></details>
    <div class="hydro-cg-grid">
      <label><span>E · GPa</span><input id="girder-e" type="number" min=".001" step="1" value="${esc(values.eGpa)}"></label>
      <label><span>I (longitudinal vertical bending), m⁴</span><input id="girder-i" type="number" min=".000001" step=".01" placeholder="required" value="${esc(values.iM4)}"></label>
      <label><span>Extreme fibre distance c, m</span><input id="girder-c" type="number" min=".0001" step=".1" value="${esc(values.extremeFiberM)}" placeholder="required"></label>
      <label><span>Neutral axis z, m</span><input id="girder-neutral-z" type="number" step=".1" value="${esc(values.neutralZ)}"></label>
      <label><span>Minimum beam divisions</span><input id="girder-segments" type="number" min="2" max="50" step="1" value="${esc(values.segments)}"></label>
    </div>
    <button class="btn" id="girder-run" type="button">Calculate hull girder FEM</button>
    <button class="btn" id="girder-frame-example" type="button">Show legacy frame reference</button>
    <label class="field"><span>3D color mode</span><select id="girder-color-mode">
       <option value="stress">Signed bending stress (MPa)</option>
       <option value="off">Normal model color</option>
    </select></label>
    ${error?`<p class="hydro-solve-error" role="alert">${esc(error)}</p>`:""}
    <p class="muted">Beam E, I, supports and baseline distributed weight are engineer-defined. End restraints either represent a test fixture with reported reactions or numerical rigid-body stabilization in the strictly balanced floating mode. Do not infer hull strength from solid STL skin.</p>`;
  const results=result?`<div class="hull-fem-results">
    <h3>Stress contours · longitudinal beam approximation</h3>
    <div class="hull-fem-colorbar" aria-label="Signed stress scale">
      <span>${fmt(-result.maxStressPa/1e6,2)} MPa</span><div class="hull-fem-gradient"></div>
      <span>${fmt(result.maxStressPa/1e6,2)} MPa</span>
    </div>
    <p class="muted">Blue and red represent opposite signed longitudinal fibre stress. Colors are projected onto actual 3D mesh vertices; this is NOT a shell-element von Mises plot.</p>
    ${result.buoyancyTransfer?hullGirderLoadDiagram(result):""}
    ${hullGirderDiagram(result)}
    ${hullGirderDiagram(result,{metric:"deflection"})}
    <p class="muted">Load distribution: ${result.lineLoads.length} segments ·
       ${result.loading.pointWeights.length} point masses · ${result.loading.areaLoads.length} area patches.
       Model: ${esc(modelName)}.</p>
    <div class="readout"><span>Reaction sum</span><strong>${fmt(result.reactionN/1000,3)} kN</strong></div>
    <div class="readout"><span>Applied gravity</span><strong>${fmt(result.gravityForceN/1000,3)} kN</strong></div>
    </div>`:`<div class="engineering-empty-analysis"><strong>No structural solve performed</strong><p>Provide explicit mass, structural E/I and fibre distance, then calculate. There are no default ship stresses.</p></div>`;
  return {inspector,summary,results,bounds};
}
