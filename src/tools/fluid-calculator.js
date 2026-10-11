import {FLUIDS,fluidProperties} from "./fluid-properties.js?v=3c10f5129a02a9c4c488ae499bcc7672dab50d59";

function card(label,value,unit,description){
  return `<div class="tool-result-card"><span>${label}</span><strong>${value}</strong><small>${unit}</small><p>${description}</p></div>`;
}

export function fluidCalculatorHTML({fluid="air",temperature=20,unit="C"}={}){
  let result,error=null;
  try{result=fluidProperties(fluid,temperature,unit)}catch(e){error=String(e?.message||e)}

  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / Fluid properties</div>
    <header class="tool-header">
      <div><span class="project-kicker">Engineering tool</span><h1>Fluid properties</h1>
      <p>Fast polynomial estimates migrated from the legacy calculator. Use CoolProp later for reference-grade thermophysical properties.</p></div>
    </header>
    <section class="tool-layout">
      <aside class="tool-inputs">
        <label class="field"><span>Fluid</span><select id="fluid-id">${Object.entries(FLUIDS).map(([id,item])=>`<option value="${id}" ${id===fluid?"selected":""}>${item.name}</option>`).join("")}</select></label>
        <label class="field"><span>Temperature</span><div><input id="fluid-temperature" type="number" step="0.1" value="${temperature}"><select id="fluid-unit">${["C","F","K"].map(value=>`<option value="${value}" ${value===unit?"selected":""}>${value}</option>`).join("")}</select></div></label>
        <button class="btn primary" id="fluid-calculate">Calculate</button>
        <div class="resistance-warning"><strong>Scope:</strong> legacy polynomial fits. Pressure dependence and phase boundaries are not modelled.</div>
      </aside>
      <section class="tool-results">
        ${error?`<div class="geometry-warning"><strong>Calculation error</strong><span>${error}</span></div>`:""}
        ${result?`
          <div class="tool-result-grid">
            ${card("Density",result.density.toFixed(4),"kg/m³","Mass per unit volume")}
            ${card("Dynamic viscosity",(result.dynamicViscosity*1000).toExponential(4),"mPa·s","Resistance to shear")}
            ${card("Kinematic viscosity",(result.kinematicViscosity*1e6).toFixed(4),"mm²/s","μ / ρ")}
            ${card("Specific heat cp",result.cp.toFixed(2),"J/(kg·K)","Legacy cp fit")}
            ${card("Thermal conductivity",result.conductivity.toFixed(5),"W/(m·K)","Heat conduction")}
            ${card("Prandtl number",result.prandtl.toFixed(4),"—","Momentum / thermal diffusivity")}
            ${card("Thermal diffusivity",(result.thermalDiffusivity*1e6).toFixed(4),"mm²/s","k / (ρ cp)")}
            ${card("Thermal expansion",(result.thermalExpansion*1000).toFixed(4),"×10⁻³ K⁻¹","1 / T absolute")}
          </div>
          ${result.warnings.map(w=>`<div class="geometry-warning"><strong>Validity warning</strong><span>${w}</span></div>`).join("")}
          <p class="muted tool-source-note">${result.note}</p>
        `:""}
      </section>
    </section>
  </main>`;
}
