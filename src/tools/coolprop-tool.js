import {DEFAULT_FLUIDS,INPUTS,OUTPUTS,computeState} from "./coolprop-core.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb";
import {getCoolProp} from "../vendor/coolprop-runtime.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function inputOptions(current){
  return Object.entries(INPUTS).map(([key,meta])=>
    `<option value="${key}" ${key===current?"selected":""}>${key} · ${meta.label}</option>`
  ).join("");
}

function formatValue(value,key){
  if(value===null||value===undefined||!Number.isFinite(Number(value)))return "N/A";
  const abs=Math.abs(Number(value));
  if(abs!==0&&(abs<1e-3||abs>=1e5))return Number(value).toExponential(5);
  const digits=["T","P","H","U","S","Cp","Cv"].includes(key)?4:6;
  return Number(value).toFixed(digits).replace(/\.?0+$/,"");
}

export function coolPropToolHTML(state={}){
  const fluid=state.fluid||"Air";
  const input1=state.input1||"P";
  const input2=state.input2||"T";
  const value1=state.value1??1;
  const value2=state.value2??25;

  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / CoolProp</div>
    <header class="tool-header">
      <div><span class="project-kicker">Thermodynamics tool</span><h1>CoolProp</h1>
      <p>Local WebAssembly property engine. Choose two independent properties and calculate the thermodynamic state entirely in the browser.</p>
      <div class="tool-parity-banner"><strong>Migration in progress:</strong> the v2 state-point calculator is functional, while Batch, Process, diagrams and export are being ported. <a href="https://tormt.folk.ntnu.no/Tools/Coolprop/CoolPropForbedretKanksje2.html" target="_blank" rel="noopener">Open the full legacy tool ↗</a></div></div>
      <div class="coolprop-engine-status" id="coolprop-status">Engine not loaded</div>
    </header>
    <section class="tool-layout">
      <aside class="tool-inputs">
        <label class="field"><span>Fluid</span><select id="cp-fluid">${DEFAULT_FLUIDS.map(name=>`<option ${name===fluid?"selected":""}>${name}</option>`).join("")}</select></label>
        <label class="field"><span>Input 1</span><select id="cp-i1">${inputOptions(input1)}</select></label>
        <label class="field"><span>Value 1 · <span id="cp-u1">${esc(INPUTS[input1]?.unit||"")}</span></span><input id="cp-v1" type="number" step="any" value="${esc(value1)}"></label>
        <label class="field"><span>Input 2</span><select id="cp-i2">${inputOptions(input2)}</select></label>
        <label class="field"><span>Value 2 · <span id="cp-u2">${esc(INPUTS[input2]?.unit||"")}</span></span><input id="cp-v2" type="number" step="any" value="${esc(value2)}"></label>
        <button class="btn primary" id="cp-run">Load engine & calculate</button>
        <button class="btn" id="cp-example">Air · 1 bar · 25 °C</button>
        <div class="resistance-warning"><strong>Runs locally:</strong> the ~4.2 MB WASM engine is loaded only when this tool is used.</div>
      </aside>
      <section class="tool-results" id="cp-results">
        <div class="tool-result-card"><span>Ready</span><strong>Choose a state</strong><p>No server/API is required for the calculation.</p></div>
      </section>
    </section>
  </main>`;
}

export function bindCoolPropTool(root,state,onState){
  const status=root.querySelector("#coolprop-status");
  const results=root.querySelector("#cp-results");

  const read=()=>({
    fluid:root.querySelector("#cp-fluid")?.value||"Air",
    input1:root.querySelector("#cp-i1")?.value||"P",
    value1:Number(root.querySelector("#cp-v1")?.value),
    input2:root.querySelector("#cp-i2")?.value||"T",
    value2:Number(root.querySelector("#cp-v2")?.value)
  });

  const updateUnits=()=>{
    const i1=root.querySelector("#cp-i1")?.value;
    const i2=root.querySelector("#cp-i2")?.value;
    const u1=root.querySelector("#cp-u1");
    const u2=root.querySelector("#cp-u2");
    if(u1)u1.textContent=INPUTS[i1]?.unit||"";
    if(u2)u2.textContent=INPUTS[i2]?.unit||"";
  };

  root.querySelector("#cp-i1")?.addEventListener("change",updateUnits);
  root.querySelector("#cp-i2")?.addEventListener("change",updateUnits);

  root.querySelector("#cp-example")?.addEventListener("click",()=>{
    const next={fluid:"Air",input1:"P",value1:1,input2:"T",value2:25};
    onState(next);
  });

  root.querySelector("#cp-run")?.addEventListener("click",async()=>{
    const next=read();
    onState(next,false);
    status.textContent="Loading local engine…";
    results.innerHTML='<div class="tool-result-card"><span>CoolProp</span><strong>Loading…</strong><p>WebAssembly is loaded on demand.</p></div>';
    try{
      const engine=await getCoolProp();
      status.textContent="Engine ready";
      const result=computeState(engine,next);
      results.innerHTML=`
        <div class="coolprop-phase"><span>Phase</span><strong>${esc(result.phase)}</strong></div>
        <div class="tool-result-grid">
          ${OUTPUTS.map(([key,label,unit])=>`
            <div class="tool-result-card">
              <span>${esc(label)}</span>
              <strong>${esc(formatValue(result.values[key],key))}</strong>
              <small>${esc(unit)}</small>
            </div>`).join("")}
        </div>`;
    }catch(error){
      status.textContent="Engine error";
      results.innerHTML=`<div class="geometry-warning"><strong>CoolProp error</strong><span>${esc(error?.message||error)}</span></div>`;
    }
  });
}
