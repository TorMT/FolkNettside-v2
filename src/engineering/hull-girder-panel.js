import {stressRGB,interpolateGirderAt} from "../structure/hull-contours.js?v=48975b0ceb4945502f58223fe46edda944b239eb";

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
/**
 * FEM element-side shear and bending moment traces.
 * Duplicate X stations are retained: a point force introduces a vertical
 * jump in V, and a concentrated couple introduces a vertical jump in M.
 * No interpolating through a nodal discontinuity as if it were a smooth load.
 */
export function hullGirderActionDiagram(girder,{metric="moment",width=880,height=260}={}){
  if(!girder?.field?.length||!["moment","shear"].includes(metric))return "";
  const field=girder.field;
  const x0=girder.frame.nodes[0].x,x1=girder.frame.nodes.at(-1).x;
  if(!(x1>x0))return "";
  const key=metric==="moment"?"momentNm":"shearN";
  const unit=metric==="moment"?"kN·m":"kN";
  const label=metric==="moment"?"Global beam bending moment M":"Vertical beam shear force V";
  const range=Math.max(1,...field.map(p=>Math.abs(p[key])));
  const pad=42,axis=height/2,limit=height/2-48;
  const px=x=>pad+(x-x0)/(x1-x0)*(width-2*pad);
  const py=value=>axis-value/range*limit;
  const points=field.map(p=>[px(p.x),py(p[key])]);
  const path=points.map((p,i)=>(i?"L":"M")+p[0].toFixed(2)+","+p[1].toFixed(2)).join(" ");
  return '<svg class="hull-fem-action-chart" viewBox="0 0 '+width+" "+height+'" role="img" '+
    'aria-label="'+esc(label)+" across longitudinal X, "+unit+'; load discontinuities are retained">'+
    '<path d="M'+pad+" "+axis+"H"+(width-pad)+'" stroke="var(--line-strong)" stroke-dasharray="5 5"/>'+
    '<text x="'+pad+'" y="19" font-size="12" fill="var(--ink-2)">'+esc(label)+" · "+unit+'</text>'+
    '<text x="'+pad+'" y="36" font-size="11" fill="var(--ink-3)">peak ±'+fmt(range/1000,3)+" "+unit+'</text>'+
    '<path d="'+path+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>'+
    '<text x="'+pad+'" y="'+(height-8)+'" font-size="11" fill="var(--ink-2)">X '+fmt(x0,2)+'</text>'+
    '<text x="'+(width-pad)+'" y="'+(height-8)+'" text-anchor="end" font-size="11" fill="var(--ink-2)">X '+fmt(x1,2)+'</text>'+
    '</svg>';
}
/** A traceable section diagram; values are manually specified, not inferred. */
export function hullGirderProfileDiagram(girder,{width=880,height=275}={}){
  const elements=girder?.frame?.elements||[];
  const nodes=girder?.frame?.nodes||[];
  const mass= girder?.baselineAudit?.stations||[];
  if(!elements.length||nodes.length<2||!mass.length)return "";
  const x0=nodes[0].x,x1=nodes.at(-1).x, pad=46,scale=(width-2*pad)/(x1-x0);
  const intervals=elements.map((e,i)=>{
    const left=nodes[i].x,right=nodes[i+1].x,mid=(left+right)/2;
    const station=mass.find(row=>mid>=row.x0&&mid<=row.x1);
    return {left,right,EI:e.E*e.I,tonnesPerM:station?.tonnesPerM??0};
  });
  const maxEI=Math.max(1,...intervals.map(r=>r.EI));
  const maxMass=Math.max(.0001,...intervals.map(r=>r.tonnesPerM));
  const EIbars=[],massBars=[];
  for(const station of intervals){
    const x=pad+(station.left-x0)*scale;
    const w=(station.right-station.left)*scale;
    const upper=station.EI/maxEI*65,lower=station.tonnesPerM/maxMass*65;
    EIbars.push('<rect x="'+x.toFixed(2)+'" y="'+(96-upper).toFixed(2)+
      '" width="'+w.toFixed(2)+'" height="'+upper.toFixed(2)+'" fill="var(--accent)" opacity=".75"/>');
    massBars.push('<rect x="'+x.toFixed(2)+'" y="'+(216-lower).toFixed(2)+
      '" width="'+w.toFixed(2)+'" height="'+lower.toFixed(2)+'" fill="var(--danger)" opacity=".7"/>');
  }
  return '<svg class="hull-fem-profile-chart" viewBox="0 0 '+width+' '+height+'" role="img" '+
    'aria-label="Engineering-entered longitudinal EI bending stiffness and hull baseline mass per metre">'+
    '<text x="'+pad+'" y="17" fill="var(--accent)" font-size="12">EI(x) bending stiffness · N·m²</text>'+
    '<text x="'+(width-pad)+'" y="17" text-anchor="end" fill="var(--ink-2)" font-size="11">Max '+fmt(maxEI,0)+'</text>'+
    '<path d="M'+pad+' 96H'+(width-pad)+'" stroke="var(--line)"/>'+EIbars.join("")+
    '<text x="'+pad+'" y="135" fill="var(--danger)" font-size="12">Baseline mass(x) · tonnes/m</text>'+
    '<text x="'+(width-pad)+'" y="135" text-anchor="end" fill="var(--ink-2)" font-size="11">Max '+fmt(maxMass,3)+'</text>'+
    '<path d="M'+pad+' 216H'+(width-pad)+'" stroke="var(--line)"/>'+massBars.join("")+
    '<text x="'+pad+'" y="260" fill="var(--ink-2)" font-size="11">X '+fmt(x0,2)+' m</text>'+
    '<text x="'+(width-pad)+'" y="260" text-anchor="end" fill="var(--ink-2)" font-size="11">X '+fmt(x1,2)+' m</text>'+
    '</svg>';
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
/** Actual explicitly entered Y/Z section geometry, including elastic neutral axis. */
export function girderSectionSketchHTML(section,{width=590,height=305}={}){
  if(!section?.parts?.length)return "";
  const raw=section.parts;
  const Y=raw.flatMap(p=>p.kind==="plate"?[p.y0,p.y1]:[p.y-p.width/2,p.y+p.width/2]);
  const Z=raw.flatMap(p=>[p.zMin,p.zMax]);
  const ymin=Math.min(...Y),ymax=Math.max(...Y),zmin=Math.min(...Z),zmax=Math.max(...Z);
  const span=Math.max(ymax-ymin,zmax-zmin,.1),pad=42;
  const scale=Math.min((width-pad*2)/span,(height-pad*2)/span);
  const sx=y=>width/2+(y-(ymin+ymax)/2)*scale;
  const sy=z=>height/2-(z-(zmin+zmax)/2)*scale;
  const parts=raw.slice(0,200).map(p=>{
    if(p.kind==="plate")
      return '<line x1="'+sx(p.y0).toFixed(3)+'" y1="'+sy(p.z0).toFixed(3)+
        '" x2="'+sx(p.y1).toFixed(3)+'" y2="'+sy(p.z1).toFixed(3)+
        '" stroke="var(--accent)" stroke-width="'+Math.max(1,p.t*scale).toFixed(2)+
        '" stroke-linecap="butt"/>';
    return '<rect x="'+sx(p.y-p.width/2).toFixed(3)+
      '" y="'+sy(p.z+p.height/2).toFixed(3)+
      '" width="'+(p.width*scale).toFixed(3)+'" height="'+(p.height*scale).toFixed(3)+
      '" fill="var(--danger)" fill-opacity=".65" stroke="var(--danger)" stroke-width=".8"/>';
  }).join("");
  const zAxis=sy(section.zNeutral);
  return '<svg class="hull-fem-section-sketch" viewBox="0 0 '+width+' '+height+'" role="img" '+
    'aria-label="Declared structural cross-section in Y Z coordinates, with elastic neutral axis">'+
    '<rect width="'+width+'" height="'+height+'" fill="var(--surface-sunk)"/>'+
    parts+
    '<path d="M22 '+zAxis.toFixed(3)+'H'+(width-22)+
      '" stroke="var(--ink)" stroke-dasharray="5 4" stroke-width="1.5"/>'+
    '<text x="24" y="'+Math.max(15,zAxis-7).toFixed(3)+
      '" font-size="12" fill="var(--ink)">Elastic NA, Z = '+fmt(section.zNeutral,3)+' m</text>'+
    '<text x="25" y="'+(height-11)+'" fill="var(--ink-2)" font-size="11">Y → · m</text>'+
    '<text x="'+(width-27)+'" y="18" text-anchor="end" fill="var(--ink-2)" font-size="11">Z ↑ · m</text>'+
    '</svg>';
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
    pressureSections:caseInput.pressureSections??12,
    sectionText:caseInput.sectionText||"",
    sectionMassMode:caseInput.sectionMassMode||"independent",
    stiffnessText:caseInput.stiffnessText||"",
    massProfileText:caseInput.massProfileText||""
  };
  const summary=result?`
    <strong>Global girder · ${result.buoyancyTransfer?"pressure + gravity":"gravity-only fixture"}</strong>
    <div class="readout"><span>Mass (including loads)</span><strong>${fmt(result.loading.totalMassTonnes,2)} t</strong></div>
    <div class="readout"><span>Peak |σx| · beam fibre</span><strong>${fmt(result.maxStressPa/1e6,2)} MPa</strong></div>
    <div class="readout"><span>Peak stress at X</span><strong>${fmt(result.maxStressX,3)} m</strong></div>
    <div class="readout"><span>Peak deflection</span><strong>${fmt(result.maxDeflectionM*1000,3)} mm</strong></div>
    <div class="readout"><span>Max bending moment</span><strong>${fmt(result.maxMomentNm/1000,2)} kN·m</strong></div>
    <div class="readout"><span>Force equilibrium error</span><strong>${fmt(result.equilibriumAudit?.forceResidualN,5)} N</strong></div>
    <div class="readout"><span>Pitch-moment equilibrium error</span><strong>${fmt(result.equilibriumAudit?.momentResidualNm,5)} N·m</strong></div>
    <div class="readout"><span>Maximum deflection location</span><strong>X = ${fmt(result.peakDeflectionX,3)} m</strong></div>
    <div class="readout"><span>Baseline mass LCG from stations</span><strong>${fmt(result.baselineAudit?.centerX,3)} m</strong></div>
    <div class="readout"><span>Baseline station mass total</span><strong>${fmt(result.baselineAudit?.totalMassTonnes,3)} t</strong></div>
    <div class="readout"><span>Longitudinal section stations</span><strong>${result.stiffnessStations?.length||1}</strong></div>
    ${result.sectionModel?`<div class="readout"><span>Gross structural member mass</span><strong>${fmt(result.sectionModel.totalStructuralMassTonnes,3)} t</strong></div>
      <div class="readout"><span>Structural material LCG</span><strong>${fmt(result.sectionModel.structuralLCG,3)} m</strong></div>
      <div class="readout"><span>First section elastic NA Z</span><strong>${fmt(result.sectionModel.sections[0].zNeutral,3)} m</strong></div>`:""}
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
    <section class="hull-fem-hydro-controls" aria-label="Hydro to beam structural load model">
      <h4>Structural loading and constraints</h4>
      <label class="field"><span>Applied load case</span><select id="girder-loading-mode">
        <option value="gravity-only" ${values.loadingMode==="gravity-only"?"selected":""}>Gravity only · supported test fixture</option>
        <option value="pressure-gravity" ${values.loadingMode==="pressure-gravity"?"selected":""}>Mass + actual wetted-surface pressure strips</option>
      </select></label>
      <label class="field"><span>End restraint / floating equilibrium assumption</span><select id="girder-support-model">
        <option value="pinned-roller" ${values.supportModel==="pinned-roller"?"selected":""}>Pin and roller fixture · nonzero reactions allowed</option>
        <option value="floating-equilibrium" ${values.supportModel==="floating-equilibrium"?"selected":""}>Balanced floating mode · zero fictitious reaction required</option>
      </select></label>
      <div class="hydro-cg-grid">
        <label><span>Still-waterline Z · m</span><input id="girder-pressure-draft" type="number" step="any" value="${esc(values.pressureDraft)}"></label>
        <label><span>Water density · kg/m³</span><input id="girder-pressure-density" type="number" min="1" step="any" value="${esc(values.pressureDensity)}"></label>
        <label><span>Longitudinal stations · 2–24</span><input id="girder-pressure-sections" type="number" min="2" max="24" step="1" value="${esc(values.pressureSections)}"></label>
      </div>
      <p class="muted">Only validated outward hull triangles are pressure-integrated. The same vertical force and its X first moment are transferred to the beam; pressure strips are exact X slices with additional moment-preserving nodal force pairs. Structural E/I and baseline uniform hull mass remain assumptions.</p>
      <p class="muted">Floating mode uses pin/roller constraints to eliminate rigid-body modes ONLY after force and longitudinal moment balance are checked. An unbalanced case is rejected rather than disguised as free-floating stress. Neither option models shell stresses or arbitrary support conditions.</p>
    </section>
    <div class="hydro-cg-grid">
      <label><span>E · GPa</span><input id="girder-e" type="number" min=".001" step="1" value="${esc(values.eGpa)}"></label>
      <label><span>I (longitudinal vertical bending), m⁴</span><input id="girder-i" type="number" min=".000001" step=".01" placeholder="required" value="${esc(values.iM4)}"></label>
      <label><span>Extreme fibre distance c, m</span><input id="girder-c" type="number" min=".0001" step=".1" value="${esc(values.extremeFiberM)}" placeholder="required"></label>
      <label><span>Neutral axis z, m</span><input id="girder-neutral-z" type="number" step=".1" value="${esc(values.neutralZ)}"></label>
      <label><span>Minimum beam divisions</span><input id="girder-segments" type="number" min="2" max="50" step="1" value="${esc(values.segments)}"></label>
    </div>
    <details class="hull-girder-section-editor">
      <summary>Structural cross-sections · plating, stiffeners, materials</summary>
      <p class="muted">Define the actual longitudinal structural cross-section per X interval. Y/Z coordinates, dimensions and thicknesses are in metres. Repeat X interval for each member; intervals must cover the full beam.</p>
      <label class="field"><span>Cross-section members (CSV rows)</span>
        <textarea id="girder-section-members" spellcheck="false" rows="8" placeholder="plate,0,5,-2,1,2,1,.012,210,7850&#10;plate,0,5,-2,-1,-2,1,.01,210,7850&#10;stiffener,0,5,0,-.8,.12,.15,210,7850">${esc(values.sectionText)}</textarea></label>
      <div id="girder-section-sketch"></div>
      <small>Plate: <code>plate, x0, x1, y0, z0, y1, z1, thickness, E_GPa, density_kg_m3</code></small>
      <small>Rectangular stiffener: <code>stiffener, x0, x1, y_c, z_c, width_y, height_z, E_GPa, density_kg_m3</code></small>
      <label class="field"><span>How to treat calculated structural weight</span>
        <select id="girder-section-mass-mode">
          <option value="independent" ${values.sectionMassMode==="independent"?"selected":""}>Stiffness only · preserve separately entered hull mass profile</option>
          <option value="derived" ${values.sectionMassMode==="derived"?"selected":""}>Use section material mass as complete baseline ONLY if mass and LCG match</option>
        </select></label>
      <p class="muted">Nonempty structural members replace the manual EI station table. The general E input defines the equivalent-I reference modulus; each member retains its own E for bending stresses. General I and c become fallback values.</p>
      <p class="muted">Overlapping plate/stiffener metal is detected and blocks stiffness/mass evaluation until corrected. Touching edges are allowed. Openings, corrosion, effective breadth, shear lag and buckling are not included. Structural member mass normally excludes machinery, fluids and outfitting.</p>
    </details>
    <details class="hull-girder-profiles">
      <summary>Longitudinal beam profiles · E(x), I(x), baseline mass(x)</summary>
      <p class="muted">Optional complete X-station tables, one row per interval. When empty, constant E/I and uniform baseline hull mass are used. If entered, each profile must cover the full structural X span without gaps or overlaps. Segment boundaries become actual FEM nodes.</p>
      <label class="field"><span>Structural sections: x0 [m], x1 [m], E [GPa], I [m⁴]</span>
        <textarea id="girder-stiffness-profile" spellcheck="false" rows="4" placeholder="e.g. 0, 5, 210, 0.10&#10;5, 10, 210, 0.15">${esc(values.stiffnessText)}</textarea></label>
      <p class="muted">Provide measured or separately calculated longitudinal section properties. A graphical hull skin does not define plate thickness, bulkheads or steel section inertia.</p>
      <label class="field"><span>Baseline hull mass stations: x0 [m], x1 [m], mass [t/m]</span>
        <textarea id="girder-mass-profile" spellcheck="false" rows="4" placeholder="e.g. 0, 5, 2&#10;5, 10, 8">${esc(values.massProfileText)}</textarea></label>
      <p class="muted">The mass integral must equal baseline hull mass above; the profile LCG must equal hull CG X. Added masses stay separate, including graphical area loads. Profiles are never normalized to fit input automatically.</p>
    </details>
    <button class="btn" id="girder-run" type="button">Calculate hull girder FEM</button>
    <button class="btn" id="girder-frame-example" type="button">Show legacy frame reference</button>
    <label class="field"><span>3D color mode</span><select id="girder-color-mode">
       <option value="stress">Signed bending stress (MPa)</option>
       <option value="off">Normal model color</option>
    </select></label>
    ${error?`<p class="hydro-solve-error" role="alert">${esc(error)}</p>`:""}
    <p class="muted">If sectional or mass profile rows are provided, the sections must cover the full longitudinal span and pass independent mass and LCG validation. Baseline mass is never inferred from water displacement.</p>
    <p class="muted">Beam E, I, supports and baseline distributed weight are engineer-defined. End restraints either represent a test fixture with reported reactions or numerical rigid-body stabilization in the strictly balanced floating mode. Do not infer hull strength from solid STL skin.</p>`;
  const results=result?`<div class="hull-fem-results">
    <h3>Stress contours · longitudinal beam approximation</h3>
    <div class="hull-fem-colorbar" aria-label="Signed stress scale">
      <span>${fmt(-result.maxStressPa/1e6,2)} MPa</span><div class="hull-fem-gradient"></div>
      <span>${fmt(result.maxStressPa/1e6,2)} MPa</span>
    </div>
    <p class="muted">Blue and red represent opposite signed longitudinal fibre stress. Colors are projected onto actual 3D mesh vertices; this is NOT a shell-element von Mises plot.</p>
    <p class="muted">The shear and bending-moment diagrams include FEM element-side limits. Sharp jumps reflect concentrated forces or applied couples, not smooth distributed pressure. Deflection maxima include stationary points inside elements.</p>
    ${result.sectionModel?`<details class="hull-fem-section-results" open>
      <summary>Calculated structural sections · Y/Z and properties</summary>
      <p class="muted">Declared geometry only: blue plating, red rectangular stiffeners and dashed elastic neutral axis.</p>
      ${girderSectionSketchHTML(result.sectionModel.sections[0])}
      <div class="hydro-force-table-wrap"><table>
        <thead><tr><th>X interval (m)</th><th>Elastic NA Z (m)</th><th>EI (N·m²)</th><th>Member mass (t/m)</th></tr></thead>
        <tbody>${result.sectionModel.sections.map(sec=>`<tr><td>${fmt(sec.x0,2)} – ${fmt(sec.x1,2)}</td><td>${fmt(sec.zNeutral,3)}</td><td>${fmt(sec.EI,0)}</td><td>${fmt(sec.tonnesPerM,4)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="muted">Bending fibre stress uses each member's E and distance to the composite elastic NA. The equivalent I is referenced to the entered general E; mixed-material section inertia differs from purely geometric I.</p>
    </details>`:""}
    ${hullGirderProfileDiagram(result)}
    ${result.buoyancyTransfer?hullGirderLoadDiagram(result):""}
    ${hullGirderDiagram(result)}
    ${hullGirderDiagram(result,{metric:"deflection"})}
    ${hullGirderActionDiagram(result,{metric:"shear"})}
    ${hullGirderActionDiagram(result,{metric:"moment"})}
    <div class="hull-fem-export-row">
      <button class="btn" type="button" id="girder-export-response">Export response CSV</button>
      <button class="btn" type="button" id="girder-export-loads">Export load strips CSV</button>
      <button class="btn" type="button" id="girder-export-reactions">Export reactions CSV</button>
      <button class="btn" type="button" id="girder-export-sections">Export EI/mass sections CSV</button>
    </div>
    <p class="muted">Load distribution: ${result.lineLoads.length} segments ·
       ${result.loading.pointWeights.length} point masses · ${result.loading.areaLoads.length} area patches.
       Model: ${esc(modelName)}.</p>
    <div class="readout"><span>Reaction sum</span><strong>${fmt(result.reactionN/1000,3)} kN</strong></div>
    <div class="readout"><span>Applied gravity</span><strong>${fmt(result.gravityForceN/1000,3)} kN</strong></div>
    </div>`:`<div class="engineering-empty-analysis"><strong>No structural solve performed</strong><p>Provide explicit mass, structural E/I and fibre distance, then calculate. There are no default ship stresses.</p></div>`;
  return {inspector,summary,results,bounds};
}
