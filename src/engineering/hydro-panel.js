import {analyzeHydrostatics} from "../hydro/hydrostatics.js";
import {boxMesh} from "../hydro/fixtures.js";

const DEMO={L:10,B:3,H:2,density:1025};

export function evaluateHydroDemo(draft){
  const clamped=Math.max(0,Math.min(DEMO.H,Number(draft)||0));
  const result=analyzeHydrostatics(boxMesh({L:DEMO.L,B:DEMO.B,H:DEMO.H}),clamped);
  return {
    ...result,
    draft:clamped,
    displacementTonnes:result.volume*DEMO.density/1000,
    density:DEMO.density,
    dimensions:{L:DEMO.L,B:DEMO.B,H:DEMO.H}
  };
}

export function hydroPanelHTML(state){
  const r=evaluateHydroDemo(state.draft);
  const cb=r.centerOfBuoyancy;
  return {
    inspector:`
      <h3>Hydro case</h3>
      <label class="field"><span>Draft / waterline</span><div><input id="hydro-draft" type="number" min="0" max="${r.dimensions.H}" step="0.05" value="${r.draft.toFixed(2)}"><span> m</span></div></label>
      <div class="readout"><span>Water density</span><strong>${r.density} kg/m³</strong></div>
      <div class="readout"><span>Fixture</span><strong>${r.dimensions.L} × ${r.dimensions.B} × ${r.dimensions.H} m</strong></div>
      <p class="muted hydro-note">Analytic regression fixture. The same engine will next consume selected ModelDocument geometry.</p>
    `,
    summary:`
      <strong>Hydro summary</strong>
      <div class="readout"><span>Volume</span><strong>${r.volume.toFixed(3)} m³</strong></div>
      <div class="readout"><span>Displacement</span><strong>${r.displacementTonnes.toFixed(2)} t</strong></div>
      <div class="readout"><span>CB z</span><strong>${cb[2].toFixed(3)} m</strong></div>
    `,
    results:`
      <div class="hydro-grid">
        <div><span class="muted">CB</span><strong>(${cb.map(v=>v.toFixed(3)).join(", ")}) m</strong></div>
        <div><span class="muted">Waterplane area</span><strong>${r.waterplane.area.toFixed(3)} m²</strong></div>
        <div><span class="muted">Ixx</span><strong>${r.waterplane.ixx.toFixed(3)} m⁴</strong></div>
        <div><span class="muted">Iyy</span><strong>${r.waterplane.iyy.toFixed(3)} m⁴</strong></div>
      </div>
    `,
    waterlinePercent:Math.max(0,Math.min(100,(r.draft/r.dimensions.H)*100))
  };
}
