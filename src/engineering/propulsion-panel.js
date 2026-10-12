import {actuatorDisk,actuatorDiskCurve} from "../propulsion/actuator-disk.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";

let fixturePromise;
function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
export function loadPropulsionFixture(path="./examples/engineering/propulsion-actuator-disk.json"){
  if(!fixturePromise){
    fixturePromise=fetch(path).then(response=>{
      if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
      return response.json();
    });
  }
  return fixturePromise;
}

function flowSVG(result){
  const width=760,height=360,cx=380,cy=180,r=72;
  const inflow=Math.min(160,30+result.diskVelocity*18);
  const wake=Math.min(210,30+result.farWakeVelocity*18);
  return `<svg class="propulsion-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Ideal actuator disk flow estimate">
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="var(--accent)"/></marker>
    </defs>
    <line x1="70" y1="${cy}" x2="${cx-r-18}" y2="${cy}" stroke="var(--line-strong)" stroke-width="20" stroke-linecap="round" opacity=".28"/>
    <line x1="${cx+r+18}" y1="${cy}" x2="700" y2="${cy}" stroke="var(--accent)" stroke-width="28" stroke-linecap="round" opacity=".22"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--surface)" stroke="var(--accent)" stroke-width="5"/>
    <line x1="${cx}" y1="${cy-r}" x2="${cx}" y2="${cy+r}" stroke="var(--accent)" stroke-width="7"/>
    <line x1="${cx-inflow}" y1="${cy-36}" x2="${cx-r-12}" y2="${cy-36}" stroke="var(--accent)" stroke-width="3" marker-end="url(#arrow)"/>
    <line x1="${cx+r+12}" y1="${cy+36}" x2="${cx+wake}" y2="${cy+36}" stroke="var(--accent)" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="76" y="110" fill="var(--ink-2)" font-size="13">V₀ = ${result.inflowSpeed?.toFixed?.(2)??""} m/s</text>
    <text x="500" y="255" fill="var(--ink-2)" font-size="13">far wake = ${result.farWakeVelocity.toFixed(2)} m/s</text>
    <text x="${cx-46}" y="${cy+6}" fill="var(--ink)" font-size="12">disk</text>
  </svg>`;
}

export function propulsionPanelHTML(fixture,{thrustKn,inflowSpeed,diameter,system=null}={}){
  const thrust=Number.isFinite(Number(thrustKn))?Number(thrustKn)*1000:Number(fixture.thrust);
  const inflow=Number.isFinite(Number(inflowSpeed))?Number(inflowSpeed):Number(fixture.inflowSpeed);
  const d=Number.isFinite(Number(diameter))?Number(diameter):Number(fixture.diameter);
  const input={thrust,diameter:d,inflowSpeed:inflow,density:Number(fixture.density)||1025};
  const result={...actuatorDisk(input),inflowSpeed:inflow};
  const curve=actuatorDiskCurve({diameter:d,inflowSpeed:inflow,density:input.density},{minThrust:0,maxThrust:Number(fixture.maxThrust)||thrust,samples:10});

  return {
    inspector:`
      <h3>Actuator disk case</h3>
      <label class="field"><span>Thrust</span><div><input id="propulsion-thrust" type="number" min="0" step="1" value="${thrust/1000}"><span> kN</span></div></label>
      <label class="field"><span>Inflow speed</span><div><input id="propulsion-inflow" type="number" min="0" step="0.1" value="${inflow}"><span> m/s</span></div></label>
      <label class="field"><span>Disk diameter</span><div><input id="propulsion-diameter" type="number" min="0.01" step="0.05" value="${d}"><span> m</span></div></label>
      <div class="readout"><span>ρ</span><strong>${input.density} kg/m³</strong></div>
      <p class="muted hydro-note">${esc(fixture.notes)}</p>
    `,
    summary:`
      <strong>Ideal disk estimate</strong>
      <div class="readout"><span>Induced velocity</span><strong>${result.inducedVelocity.toFixed(3)} m/s</strong></div>
      <div class="readout"><span>Far wake</span><strong>${result.farWakeVelocity.toFixed(3)} m/s</strong></div>
      <div class="readout"><span>Ideal power</span><strong>${(result.idealPower/1000).toFixed(2)} kW</strong></div>
    `,
    viewport:`<div class="propulsion-stage">${flowSVG(result)}</div>`,
    results:`<div class="propulsion-results"><div class="hydro-grid">
      <div><span class="muted">Disk area</span><strong>${result.area.toFixed(3)} m²</strong></div>
      <div><span class="muted">Disk loading</span><strong>${(result.diskLoading/1000).toFixed(3)} kN/m²</strong></div>
      <div><span class="muted">Disk velocity</span><strong>${result.diskVelocity.toFixed(3)} m/s</strong></div>
      <div><span class="muted">Ideal efficiency</span><strong>${result.idealEfficiency==null?"n/a":(result.idealEfficiency*100).toFixed(1)+"%"}</strong></div>
    </div>
    ${system?`<div class="thruster-system-results">
      <h3>Thruster-system resultant</h3>
      <div class="hydro-grid">
        <div><span class="muted">ΣFx / surge</span><strong>${(system.totalForce[0]/1000).toFixed(2)} kN</strong></div>
        <div><span class="muted">ΣFy / sway</span><strong>${(system.totalForce[1]/1000).toFixed(2)} kN</strong></div>
        <div><span class="muted">ΣFz</span><strong>${(system.totalForce[2]/1000).toFixed(2)} kN</strong></div>
        <div><span class="muted">Resultant thrust</span><strong>${(system.resultantThrust/1000).toFixed(2)} kN</strong></div>
        <div><span class="muted">Mx / roll</span><strong>${(system.totalMoment[0]/1000).toFixed(2)} kN·m</strong></div>
        <div><span class="muted">My / pitch</span><strong>${(system.totalMoment[1]/1000).toFixed(2)} kN·m</strong></div>
        <div><span class="muted">Mz / yaw</span><strong>${(system.totalMoment[2]/1000).toFixed(2)} kN·m</strong></div>
        <div><span class="muted">Ideal total power</span><strong>${(system.idealPower/1000).toFixed(2)} kW</strong></div>
      </div>
    </div>`:""}
    <div class="resistance-warning"><strong>Scope:</strong> ideal momentum theory + rigid-body force/moment balance. No blade geometry, cavitation, swirl, hull interaction or CFD.</div></div>`,
    result,curve,thrustKn:thrust/1000,inflowSpeed:inflow,diameter:d
  };
}
