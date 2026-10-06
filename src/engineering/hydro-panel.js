import {analyzeModelDocument} from "../hydro/hydrostatics.js";

function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0))}

export function hydroPanelHTML(modelDocument,state={},config={}){
  const density=Number(config.density)||1025;
  const minDraft=Number.isFinite(Number(config.minDraft))?Number(config.minDraft):0;
  const maxDraft=Number.isFinite(Number(config.maxDraft))?Number(config.maxDraft):10;
  const draft=clamp(state.draft??config.defaultDraft??0,minDraft,maxDraft);
  const explicit=modelDocument.components.some(component=>Object.prototype.hasOwnProperty.call(component.metadata||{},"hydro"));
  const result=analyzeModelDocument(modelDocument,draft,{
    include:component=>component.geometry&&(explicit?component.metadata?.hydro===true:true)
  });
  const cb=result.centerOfBuoyancy;
  const displacementTonnes=result.volume*density/1000;
  const included=result.components.length;
  const span=Math.max(maxDraft-minDraft,1e-9);

  return {
    inspector:`
      <h3>Hydro case</h3>
      <label class="field"><span>Draft / waterline</span><div><input id="hydro-draft" type="number" min="${minDraft}" max="${maxDraft}" step="0.05" value="${draft.toFixed(2)}"><span> m</span></div></label>
      <div class="readout"><span>Water density</span><strong>${density} kg/m³</strong></div>
      <div class="readout"><span>Source</span><strong>${modelDocument.name}</strong></div>
      <div class="readout"><span>Included geometry</span><strong>${included} component(s)</strong></div>
      <p class="muted hydro-note">Calculated from the imported ModelDocument in world-space metres. Components tagged hydro=false are excluded.</p>
    `,
    summary:`
      <strong>Hydro summary</strong>
      <div class="readout"><span>Volume</span><strong>${result.volume.toFixed(3)} m³</strong></div>
      <div class="readout"><span>Displacement</span><strong>${displacementTonnes.toFixed(2)} t</strong></div>
      <div class="readout"><span>CB z</span><strong>${cb[2].toFixed(3)} m</strong></div>
    `,
    results:`
      <div class="hydro-grid">
        <div><span class="muted">CB</span><strong>(${cb.map(v=>v.toFixed(3)).join(", ")}) m</strong></div>
        <div><span class="muted">Waterplane area</span><strong>${result.waterplane.area.toFixed(3)} m²</strong></div>
        <div><span class="muted">Ixx</span><strong>${result.waterplane.ixx.toFixed(3)} m⁴</strong></div>
        <div><span class="muted">Iyy</span><strong>${result.waterplane.iyy.toFixed(3)} m⁴</strong></div>
      </div>
    `,
    draft,
    density,
    result,
    waterlinePercent:((draft-minDraft)/span)*100
  };
}
