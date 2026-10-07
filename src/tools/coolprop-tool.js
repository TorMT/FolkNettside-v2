import {
  DEFAULT_FLUIDS,DEFAULT_UNITS,INPUTS,OUTPUTS,PROCESS_TYPES,TABLE4_PRESETS,
  computeBatch,computeProcess,computeState,computeTable4,courseTableLabel,processTargetOptions,
  rowsToCSV,rowsToJSON,saturationWarning,tableReferenceProfile,unitLabel
} from "./coolprop-core.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
import {getCoolProp} from "../vendor/coolprop-runtime.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
import {mountCoolPropDiagram} from "./coolprop-diagram-view.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
import {COOLPROP_HELP,searchCoolPropHelp} from "./coolprop-help.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function inputOptions(current){
  return Object.entries(INPUTS).map(([key,meta])=>
    `<option value="${key}" ${key===current?"selected":""}>${key} · ${meta.label}</option>`
  ).join("");
}

function selectOptions(values,current){
  return values.map(value=>`<option value="${value}" ${String(value)===String(current)?"selected":""}>${value}</option>`).join("");
}

function formatValue(value){
  if(value===null||value===undefined||!Number.isFinite(Number(value)))return "N/A";
  const number=Number(value),abs=Math.abs(number);
  if(abs!==0&&(abs<1e-3||abs>=1e6))return number.toExponential(5);
  return number.toFixed(5).replace(/\.?0+$/,"");
}

function normalizedState(state={}){
  return {
    tab:state.tab||"single",
    fluid:state.fluid||"Air",
    units:{...DEFAULT_UNITS,...(state.units||{})},
    bookBasis:Boolean(state.bookBasis),
    single:{
      input1:state.single?.input1||state.input1||"P",
      value1:state.single?.value1??state.value1??1,
      input2:state.single?.input2||state.input2||"T",
      value2:state.single?.value2??state.value2??25
    },
    batch:{
      mode:state.batch?.mode||"multi",
      format:state.batch?.format||"TP",
      rows:state.batch?.rows??"25,1\n100,5\n200,10",
      outputs:state.batch?.outputs||["H","S","Phase"]
    },
    process:{
      start:state.process?.start||{input1:"P",value1:1,input2:"T",value2:25,description:"Point 1"},
      steps:state.process?.steps||[]
    },
    explore:{
      input1:state.explore?.input1||"T",
      value1:state.explore?.value1??25,
      input2:state.explore?.input2||"P",
      value2:state.explore?.value2??1
    },
    diagram:{
      visible:Boolean(state.diagram?.visible),
      type:state.diagram?.type||"log-ph",
      isotherms:state.diagram?.isotherms!==false,
      isobars:state.diagram?.isobars!==false,
      quality:state.diagram?.quality!==false,
      source:state.diagram?.source||"",
      states:Array.isArray(state.diagram?.states)?state.diagram.states:[]
    },
    exportRows:state.exportRows||[],
    exportName:state.exportName||"coolprop-results"
  };
}

function globalSettingsHTML(s){
  const profile=tableReferenceProfile(s.fluid);
  const tableLabel=courseTableLabel(s.fluid);
  return `<section class="coolprop-global">
    <div class="coolprop-fluid-control">
      <span class="coolprop-control-kicker">Working fluid</span>
      <label class="coolprop-select-field"><select id="cp-fluid">${DEFAULT_FLUIDS.map(name=>`<option ${name===s.fluid?"selected":""}>${name}</option>`).join("")}</select></label>
    </div>
    <div class="coolprop-unit-controls">
      <span class="coolprop-control-kicker">Display units</span>
      <div class="coolprop-unit-grid">
        <label><span>P</span><select id="cp-pressure-unit">${selectOptions(["Pa","kPa","MPa","bar"],s.units.pressure)}</select></label>
        <label><span>T</span><select id="cp-temperature-unit">${selectOptions(["K","C"],s.units.temperature)}</select></label>
        <label><span>H / U</span><select id="cp-energy-unit">${selectOptions(["Jkg","kJkg"],s.units.energy)}</select></label>
        <label><span>S / C</span><select id="cp-entropy-unit">${selectOptions(["JkgK","kJkgK"],s.units.entropy)}</select></label>
      </div>
    </div>
    <label class="coolprop-book-toggle ${profile?"":"disabled"}"><input id="cp-book-basis" type="checkbox" ${s.bookBasis&&profile?"checked":""} ${profile?"":"disabled"}><span><strong>${esc(tableLabel)}</strong><small>${profile?"Shift H/U/S to the selected course-table reference":"No calibrated course-table reference yet"}</small></span></label>
  </section>`;
}

function singleHTML(s){
  const x=s.single;
  return `<section class="coolprop-mode" data-mode="single" ${s.tab==="single"?"":"hidden"}>
    <div class="coolprop-input-grid">
      <label class="field"><span>Input 1</span><select id="cp-single-i1">${inputOptions(x.input1)}</select></label>
      <label class="field"><span>Value 1</span><input id="cp-single-v1" type="number" step="any" value="${esc(x.value1)}"></label>
      <label class="field"><span>Input 2</span><select id="cp-single-i2">${inputOptions(x.input2)}</select></label>
      <label class="field"><span>Value 2</span><input id="cp-single-v2" type="number" step="any" value="${esc(x.value2)}"></label>
    </div>
    <div class="coolprop-actions"><button class="btn primary" id="cp-single-run">Calculate state</button><button class="btn" id="cp-single-example">1 bar · 25 °C</button><button class="btn" id="cp-single-diagram">Show diagram</button></div>
    <div id="cp-single-results" class="coolprop-results"><div class="tool-result-card"><span>Ready</span><strong>Choose a state</strong><p>The WASM engine loads only when calculation starts.</p></div></div>
  </section>`;
}

function batchHTML(s){
  const x=s.batch;
  const outputChoices=[...OUTPUTS.map(([key])=>key),"Phase"];
  return `<section class="coolprop-mode" data-mode="batch" ${s.tab==="batch"?"":"hidden"}>
    <div class="coolprop-input-grid">
      <label class="field"><span>Batch mode</span><select id="cp-batch-mode">${selectOptions(["multi","table4"],x.mode)}</select></label>
      <label class="field"><span>Batch format</span><select id="cp-batch-format">${selectOptions(x.mode==="table4"?["TP","PT"]:["TP","PT","PH","PU"],x.format)}</select></label>
      <label class="field coolprop-span-2"><span>Input rows · one state per line</span><textarea id="cp-batch-rows" rows="8">${esc(x.rows)}</textarea></label>
    </div>
    <div class="coolprop-table4-note" ${x.mode==="table4"?"":"hidden"}><strong>Legacy Table 4</strong><span>v ideal = R T / P · v real = 1/ρ · diff % · Z</span></div>
    <div class="coolprop-output-pills" ${x.mode==="table4"?"hidden":""}>
      ${outputChoices.map(key=>`<label><input type="checkbox" data-cp-batch-output="${key}" ${x.outputs.includes(key)?"checked":""}><span>${key}</span></label>`).join("")}
    </div>
    <div class="coolprop-actions"><button class="btn primary" id="cp-batch-run">Run batch</button><button class="btn" id="cp-batch-example">Load example</button><button class="btn" id="cp-table4-air" ${x.mode==="table4"?"":"hidden"}>Air Table 4</button><button class="btn" id="cp-table4-water" ${x.mode==="table4"?"":"hidden"}>Water Table 4</button><button class="btn" id="cp-batch-diagram">Show diagram</button></div>
    <div id="cp-batch-results" class="coolprop-results"><div class="tool-result-card"><span>Batch</span><strong>Multi-output + legacy Table 4</strong><p>Table 4 reproduces the legacy ideal-vs-real specific-volume comparison.</p></div></div>
  </section>`;
}

function processStepHTML(step,index){
  const type=step.processType||"isobaric";
  const targets=processTargetOptions(type);
  const target=targets.includes(step.targetType)?step.targetType:targets[0];
  return `<article class="coolprop-process-step" data-process-index="${index}">
    <div class="coolprop-process-step-head"><strong>Point ${index+2}</strong><button class="tool-action" data-remove-process="${index}">Remove</button></div>
    <div class="coolprop-process-grid">
      <label class="field"><span>Process</span><select data-process-field="processType" data-process-index="${index}">${Object.entries(PROCESS_TYPES).map(([key,value])=>`<option value="${key}" ${key===type?"selected":""}>${value.label}</option>`).join("")}</select></label>
      <label class="field"><span>New property</span><select data-process-field="targetType" data-process-index="${index}">${targets.map(key=>`<option value="${key}" ${key===target?"selected":""}>${key}</option>`).join("")}</select></label>
      <label class="field"><span>Target value</span><input type="number" step="any" data-process-field="targetValue" data-process-index="${index}" value="${esc(step.targetValue??"")}"></label>
      <label class="field"><span>Description</span><input data-process-field="description" data-process-index="${index}" value="${esc(step.description||"")}"></label>
    </div>
  </article>`;
}

function processHTML(s){
  const start=s.process.start;
  return `<section class="coolprop-mode" data-mode="process" ${s.tab==="process"?"":"hidden"}>
    <div class="coolprop-subhead"><strong>Starting point</strong><span>The following steps preserve one property from the previous point.</span></div>
    <div class="coolprop-input-grid">
      <label class="field"><span>Input 1</span><select id="cp-start-i1">${inputOptions(start.input1)}</select></label>
      <label class="field"><span>Value 1</span><input id="cp-start-v1" type="number" step="any" value="${esc(start.value1)}"></label>
      <label class="field"><span>Input 2</span><select id="cp-start-i2">${inputOptions(start.input2)}</select></label>
      <label class="field"><span>Value 2</span><input id="cp-start-v2" type="number" step="any" value="${esc(start.value2)}"></label>
      <label class="field coolprop-span-3"><span>Description</span><input id="cp-start-description" value="${esc(start.description||"Point 1")}"></label>
    </div>
    <div id="cp-process-steps">${s.process.steps.map(processStepHTML).join("")||'<div class="search-empty">No process steps yet.</div>'}</div>
    <div class="coolprop-actions"><button class="btn" id="cp-process-add">+ Add step</button><button class="btn primary" id="cp-process-run">Calculate process</button><button class="btn" id="cp-process-example">Rankine-style example</button><button class="btn" id="cp-process-clear">Clear steps</button><button class="btn" id="cp-process-diagram">Show diagram</button></div>
    <div id="cp-process-results" class="coolprop-results"></div>
  </section>`;
}

function exploreHTML(s){
  const x=s.explore;
  return `<section class="coolprop-mode" data-mode="explore" ${s.tab==="explore"?"":"hidden"}>
    <div class="coolprop-input-grid">
      <label class="field"><span>Input 1</span><select id="cp-explore-i1">${inputOptions(x.input1)}</select></label>
      <label class="field"><span>Value 1</span><input id="cp-explore-v1" type="number" step="any" value="${esc(x.value1)}"></label>
      <label class="field"><span>Input 2</span><select id="cp-explore-i2">${inputOptions(x.input2)}</select></label>
      <label class="field"><span>Value 2</span><input id="cp-explore-v2" type="number" step="any" value="${esc(x.value2)}"></label>
    </div>
    <div class="coolprop-actions"><button class="btn primary" id="cp-explore-run">Fetch all data</button><button class="btn" id="cp-explore-example">Example</button></div>
    <div id="cp-explore-results" class="coolprop-results"></div>
  </section>`;
}

export function coolPropToolHTML(state={}){
  const s=normalizedState(state);
  return `<main class="tool-page coolprop-page">
    <div class="crumbs">Courses / Tools / CoolProp</div>
    <header class="tool-header coolprop-header">
      <div class="coolprop-title-copy">
        <div class="coolprop-title-meta"><span class="project-kicker">Thermodynamics</span><span class="coolprop-verified-badge">Real-WASM verified</span></div>
        <h1>CoolProp</h1>
        <p>Thermophysical states, processes and diagrams from the local CoolProp engine.</p>
        <details class="coolprop-verification">
          <summary>Numerical verification</summary>
          <span>Air A-22 is CI-checked at 300 / 400 / 1000 / 1200 K with inverse P-h, plus Water saturation and R134a two-phase references. <a href="https://tormt.folk.ntnu.no/Tools/Coolprop/CoolPropForbedretKanksje2.html" target="_blank" rel="noopener">Legacy reference ↗</a></span>
        </details>
      </div>
      <div class="coolprop-header-actions"><div class="coolprop-engine-status" id="coolprop-status">Engine offline</div><button class="btn coolprop-help-button" id="cp-help-open">Help</button></div>
    </header>

    ${globalSettingsHTML(s)}

    <div class="coolprop-workspace-head"><span>Workspace</span><nav class="coolprop-tabs">
      ${[["single","Single"],["batch","Batch"],["process","Process"],["explore","All data"]].map(([id,label])=>`<button data-cp-tab="${id}" class="${s.tab===id?"active":""}">${label}</button>`).join("")}
    </nav></div>

    ${singleHTML(s)}
    ${batchHTML(s)}
    ${processHTML(s)}
    ${exploreHTML(s)}

    <section class="settings-card coolprop-diagram-section" id="cp-diagram-section" ${s.diagram.visible?"":"hidden"}>
      <div class="coolprop-diagram-head">
        <div><strong>Thermodynamic diagram</strong><small id="cp-diagram-source">${esc(s.diagram.source||"State points")}</small></div>
        <div class="coolprop-diagram-controls">
          <select id="cp-diagram-type">
            ${[["log-ph","log P-h"],["ph","P-h"],["ts","T-s"],["pv","P-v"]].map(([value,label])=>`<option value="${value}" ${s.diagram.type===value?"selected":""}>${label}</option>`).join("")}
          </select>
          <label><input id="cp-diagram-isotherms" type="checkbox" ${s.diagram.isotherms?"checked":""}> Isotherms</label>
          <label><input id="cp-diagram-isobars" type="checkbox" ${s.diagram.isobars?"checked":""}> Isobars</label>
          <label><input id="cp-diagram-quality" type="checkbox" ${s.diagram.quality?"checked":""}> Quality</label>
          <button class="btn" id="cp-diagram-reset">Reset</button>
          <button class="btn" id="cp-diagram-png">PNG</button>
          <button class="btn" id="cp-diagram-close">Close</button>
        </div>
      </div>
      <div id="cp-diagram-stage" class="coolprop-diagram-stage"></div>
    </section>

    <dialog id="cp-help-dialog" class="coolprop-help-dialog">
      <div class="coolprop-help-shell">
        <header><div><span class="project-kicker">CoolProp reference</span><h2>Help</h2></div><button class="btn" id="cp-help-close">Close</button></header>
        <input id="cp-help-search" type="search" placeholder="Search units, saturation, diagrams…">
        <div class="coolprop-help-layout">
          <nav id="cp-help-nav"></nav>
          <article id="cp-help-body"></article>
        </div>
      </div>
    </dialog>

    <section class="coolprop-export">
      <span>Last result</span>
      <div class="coolprop-export-actions"><button class="btn" id="cp-export-csv" ${s.exportRows.length?"":"disabled"}>CSV</button><button class="btn" id="cp-export-json" ${s.exportRows.length?"":"disabled"}>JSON</button></div>
    </section>
  </main>`;
}

function numericInput(element){
  const raw=element?.value;
  return raw===""||raw===undefined?NaN:Number(raw);
}

function readUnits(root){
  return {
    pressure:root.querySelector("#cp-pressure-unit")?.value||"bar",
    temperature:root.querySelector("#cp-temperature-unit")?.value||"C",
    energy:root.querySelector("#cp-energy-unit")?.value||"kJkg",
    entropy:root.querySelector("#cp-entropy-unit")?.value||"kJkgK"
  };
}

function stateRowsForExport(state){
  const row={Fluid:state.fluid,Phase:state.phase};
  for(const [key] of OUTPUTS)row[key]=state.values[key];
  return [row];
}

function processRowsForExport(rows){
  return rows.map(row=>{
    if(row.status!=="OK")return {Step:row.step,Description:row.description,Status:"FAIL",Error:row.error};
    const out={Step:row.step,Description:row.description,Status:"OK",Phase:row.state.phase};
    for(const key of ["P","T","H","S","U","D","Q"])out[key]=row.state.values[key];
    return out;
  });
}

function batchRowsForExport(rows){
  return rows.map(row=>{
    if(row.status!=="OK")return {Row:row.index,Status:"FAIL",Error:row.error};
    return {Row:row.index,Status:"OK",...row.inputs,...row.values};
  });
}

function resultGrid(state,units){
  return `<div class="coolprop-phase"><span>Phase</span><strong>${esc(state.phase)}</strong></div>
    <div class="tool-result-grid">
      ${OUTPUTS.map(([key,label])=>`<div class="tool-result-card"><span>${esc(label)}</span><strong>${esc(formatValue(state.values[key]))}</strong><small>${esc(unitLabel(key,units))}</small></div>`).join("")}
    </div>`;
}

function genericTable(rows){
  if(!rows.length)return '<div class="search-empty">No rows.</div>';
  const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  return `<div class="coolprop-table-wrap"><table><thead><tr>${keys.map(key=>`<th>${esc(key)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${keys.map(key=>`<td>${esc(row[key]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function downloadText(filename,text,mime){
  const blob=new Blob([text],{type:mime});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}

export function bindCoolPropTool(root,state,onState){
  let s=normalizedState(state);
  let diagramHandle=null;
  let lastEngine=null;
  const status=root.querySelector("#coolprop-status");

  const syncGlobal=()=>({
    ...s,
    fluid:root.querySelector("#cp-fluid")?.value||s.fluid,
    units:readUnits(root),
    bookBasis:Boolean(root.querySelector("#cp-book-basis")?.checked)
  });

  const save=(next,rerender=false)=>{
    s=normalizedState({...s,...next});
    onState(s,rerender);
    root.querySelector("#cp-export-csv")?.toggleAttribute("disabled",!s.exportRows.length);
    root.querySelector("#cp-export-json")?.toggleAttribute("disabled",!s.exportRows.length);
  };

  root.querySelector("#cp-fluid")?.addEventListener("change",()=>{
    const next=syncGlobal();
    if(!tableReferenceProfile(next.fluid))next.bookBasis=false;
    save(next,true);
  });
  for(const selector of ["#cp-pressure-unit","#cp-temperature-unit","#cp-energy-unit","#cp-entropy-unit","#cp-book-basis"]){
    root.querySelector(selector)?.addEventListener("change",()=>save(syncGlobal(),false));
  }

  root.querySelectorAll("[data-cp-tab]").forEach(button=>button.addEventListener("click",()=>{
    save({...syncGlobal(),tab:button.dataset.cpTab},true);
  }));

  const getEngine=async()=>{
    status.textContent="Loading local engine…";
    const engine=await getCoolProp();
    lastEngine=engine;
    status.textContent="Engine ready";
    return engine;
  };

  const diagramState=()=>({
    visible:true,
    type:root.querySelector("#cp-diagram-type")?.value||s.diagram.type||"log-ph",
    isotherms:root.querySelector("#cp-diagram-isotherms")?.checked??s.diagram.isotherms,
    isobars:root.querySelector("#cp-diagram-isobars")?.checked??s.diagram.isobars,
    quality:root.querySelector("#cp-diagram-quality")?.checked??s.diagram.quality,
    source:s.diagram.source,
    states:s.diagram.states
  });

  const mountDiagram=async(diagram=s.diagram)=>{
    if(!diagram?.states?.length)return;
    const section=root.querySelector("#cp-diagram-section");
    const stage=root.querySelector("#cp-diagram-stage");
    if(!section||!stage)return;
    section.hidden=false;
    diagramHandle?.cleanup?.();
    const engine=lastEngine||await getEngine();
    diagramHandle=mountCoolPropDiagram(stage,{
      engine,
      fluid:root.querySelector("#cp-fluid")?.value||s.fluid,
      type:diagram.type||"log-ph",
      states:diagram.states,
      options:{
        isotherms:diagram.isotherms,
        isobars:diagram.isobars,
        quality:diagram.quality,
        bookBasis:s.bookBasis
      }
    });
  };

  const setDiagramStates=(states,source)=>{
    s=normalizedState({...s,diagram:{...s.diagram,states,source}});
    onState(s,false);
  };

  const showDiagram=async(source)=>{
    if(!s.diagram.states.length){
      const target=root.querySelector("#cp-"+source+"-results");
      if(target)target.insertAdjacentHTML("afterbegin",'<div class="geometry-warning"><strong>Diagram</strong><span>Calculate valid state points first.</span></div>');
      return;
    }
    s=normalizedState({...s,diagram:{...s.diagram,...diagramState(),visible:true,source}});
    onState(s,false);
    await mountDiagram(s.diagram);
  };

  const helpDialog=root.querySelector("#cp-help-dialog");
  const helpNav=root.querySelector("#cp-help-nav");
  const helpBody=root.querySelector("#cp-help-body");
  const helpSearch=root.querySelector("#cp-help-search");
  let selectedHelpId="overview";

  const renderHelp=(query="")=>{
    const topics=searchCoolPropHelp(query);
    helpNav.replaceChildren();
    for(const topic of topics){
      const button=document.createElement("button");
      button.type="button";
      button.className=topic.id===selectedHelpId?"active":"";
      const title=document.createElement("strong");
      title.textContent=topic.title;
      const description=document.createElement("small");
      description.textContent=topic.description;
      button.append(title,description);
      button.addEventListener("click",()=>{
        selectedHelpId=topic.id;
        renderHelp(helpSearch.value);
      });
      helpNav.append(button);
    }
    const selected=topics.find(topic=>topic.id===selectedHelpId)||topics[0]||null;
    helpBody.replaceChildren();
    if(!selected){
      const empty=document.createElement("p");
      empty.className="muted";
      empty.textContent="No matching help topics.";
      helpBody.append(empty);
      return;
    }
    selectedHelpId=selected.id;
    [...helpNav.children].forEach(button=>button.classList.toggle("active",button.querySelector("strong")?.textContent===selected.title));
    const h=document.createElement("h3");h.textContent=selected.title;
    const p=document.createElement("p");p.textContent=selected.body;
    const extra=document.createElement("div");extra.className="coolprop-help-extra";extra.textContent=selected.extra;
    helpBody.append(h,p,extra);
  };

  root.querySelector("#cp-help-open")?.addEventListener("click",()=>{
    renderHelp("");
    helpSearch.value="";
    helpDialog?.showModal();
    helpSearch?.focus();
  });
  root.querySelector("#cp-help-close")?.addEventListener("click",()=>helpDialog?.close());
  helpDialog?.addEventListener("click",event=>{if(event.target===helpDialog)helpDialog.close()});
  helpSearch?.addEventListener("input",event=>renderHelp(event.target.value));

  root.querySelector("#cp-single-example")?.addEventListener("click",()=>{
    save({...syncGlobal(),tab:"single",single:{input1:"P",value1:1,input2:"T",value2:25}},true);
  });

  root.querySelector("#cp-single-run")?.addEventListener("click",async()=>{
    const units=readUnits(root);
    const next={
      input1:root.querySelector("#cp-single-i1")?.value||"P",
      value1:numericInput(root.querySelector("#cp-single-v1")),
      input2:root.querySelector("#cp-single-i2")?.value||"T",
      value2:numericInput(root.querySelector("#cp-single-v2"))
    };
    const target=root.querySelector("#cp-single-results");
    target.innerHTML='<div class="viewer-loading">Calculating…</div>';
    try{
      const engine=await getEngine();
      const fluid=root.querySelector("#cp-fluid").value;
      const warning=saturationWarning(engine,{fluid,...next,units});
      const result=computeState(engine,{fluid,...next,units,bookBasis:root.querySelector("#cp-book-basis").checked});
      const warningHtml=warning?`<div class="geometry-warning coolprop-saturation-warning ${warning.severity}"><strong>${warning.severity==="critical"?"Two-phase ambiguity":"Near saturation"}</strong><span>${esc(warning.message)} ΔT = ${warning.deltaK.toFixed(3)} K.</span></div>`:"";
      target.innerHTML=warningHtml+resultGrid(result,units);
      save({...syncGlobal(),single:next,exportRows:stateRowsForExport(result),exportName:"coolprop-single"},false);
      setDiagramStates([result],"Single");
    }catch(error){
      status.textContent="Engine error";
      target.innerHTML=`<div class="geometry-warning"><strong>CoolProp error</strong><span>${esc(error?.message||error)}</span></div>`;
    }
  });

  root.querySelector("#cp-batch-example")?.addEventListener("click",()=>{
    save({...syncGlobal(),tab:"batch",batch:{mode:s.batch.mode||"multi",format:"TP",rows:"25,1\n100,5\n200,10",outputs:["H","S","Phase"]}},true);
  });

  const loadTable4Preset=name=>{
    const preset=TABLE4_PRESETS[name];
    if(!preset)return;
    const global=syncGlobal();
    save({
      ...global,
      fluid:preset.fluid,
      units:{...global.units,...preset.units},
      tab:"batch",
      batch:{mode:"table4",format:preset.format,rows:preset.rows,outputs:[]}
    },true);
  };
  root.querySelector("#cp-table4-air")?.addEventListener("click",()=>loadTable4Preset("Air"));
  root.querySelector("#cp-table4-water")?.addEventListener("click",()=>loadTable4Preset("Water"));

  root.querySelector("#cp-batch-mode")?.addEventListener("change",event=>{
    const mode=event.target.value;
    const format=mode==="table4"&& !["TP","PT"].includes(s.batch.format)?"TP":s.batch.format;
    save({...syncGlobal(),tab:"batch",batch:{...s.batch,mode,format}},true);
  });

  root.querySelector("#cp-batch-run")?.addEventListener("click",async()=>{
    const batch={
      mode:root.querySelector("#cp-batch-mode")?.value||"multi",
      format:root.querySelector("#cp-batch-format")?.value||"TP",
      rows:root.querySelector("#cp-batch-rows")?.value||"",
      outputs:[...root.querySelectorAll("[data-cp-batch-output]:checked")].map(input=>input.dataset.cpBatchOutput)
    };
    const target=root.querySelector("#cp-batch-results");
    target.innerHTML='<div class="viewer-loading">Calculating batch…</div>';
    try{
      const engine=await getEngine();
      if(batch.mode==="table4"){
        const rows=computeTable4(engine,{fluid:root.querySelector("#cp-fluid").value,format:batch.format,rows:batch.rows,units:readUnits(root)});
        const flat=rows.map((row,index)=>row.status==="OK"?{
          "#":index+1,
          Fluid:row.fluid,
          "T input":row.temperatureRaw,
          "P input":row.pressureRaw,
          "v ideal (m³/kg)":row.vIdeal,
          "v real (m³/kg)":row.vReal,
          "diff %":row.diffPercent,
          Z:row.Z,
          Status:"OK"
        }:{
          "#":index+1,
          Status:"FAIL: "+(row.error||"unknown error")
        });
        target.innerHTML=genericTable(flat);
        save({...syncGlobal(),batch,exportRows:flat,exportName:"coolprop-table4"},false);
        setDiagramStates([],"Table 4");
      }else{
        const rows=computeBatch(engine,{fluid:root.querySelector("#cp-fluid").value,...batch,units:readUnits(root),bookBasis:root.querySelector("#cp-book-basis").checked});
        const flat=batchRowsForExport(rows);
        target.innerHTML=genericTable(flat);
        save({...syncGlobal(),batch,exportRows:flat,exportName:"coolprop-batch"},false);
        setDiagramStates(rows.filter(row=>row.status==="OK").map(row=>row.state),"Batch");
      }
    }catch(error){
      target.innerHTML=`<div class="geometry-warning"><strong>Batch error</strong><span>${esc(error?.message||error)}</span></div>`;
    }
  });

  const readProcess=()=>({
    start:{
      input1:root.querySelector("#cp-start-i1")?.value||"P",
      value1:numericInput(root.querySelector("#cp-start-v1")),
      input2:root.querySelector("#cp-start-i2")?.value||"T",
      value2:numericInput(root.querySelector("#cp-start-v2")),
      description:root.querySelector("#cp-start-description")?.value||"Point 1"
    },
    steps:s.process.steps.map((step,index)=>({
      ...step,
      processType:root.querySelector(`[data-process-field="processType"][data-process-index="${index}"]`)?.value||step.processType,
      targetType:root.querySelector(`[data-process-field="targetType"][data-process-index="${index}"]`)?.value||step.targetType,
      targetValue:numericInput(root.querySelector(`[data-process-field="targetValue"][data-process-index="${index}"]`)),
      description:root.querySelector(`[data-process-field="description"][data-process-index="${index}"]`)?.value||""
    }))
  });

  root.querySelector("#cp-process-add")?.addEventListener("click",()=>{
    const process=readProcess();
    process.steps.push({processType:"isobaric",targetType:"T",targetValue:"",description:""});
    save({...syncGlobal(),tab:"process",process},true);
  });

  root.querySelectorAll("[data-remove-process]").forEach(button=>button.addEventListener("click",()=>{
    const process=readProcess();
    process.steps.splice(Number(button.dataset.removeProcess),1);
    save({...syncGlobal(),tab:"process",process},true);
  }));

  root.querySelectorAll('[data-process-field="processType"]').forEach(select=>select.addEventListener("change",()=>{
    const process=readProcess();
    const index=Number(select.dataset.processIndex);
    process.steps[index].processType=select.value;
    process.steps[index].targetType=processTargetOptions(select.value)[0]||"P";
    save({...syncGlobal(),tab:"process",process},true);
  }));

  root.querySelector("#cp-process-clear")?.addEventListener("click",()=>{
    save({...syncGlobal(),tab:"process",process:{...s.process,steps:[]}},true);
  });

  root.querySelector("#cp-process-example")?.addEventListener("click",()=>{
    save({...syncGlobal(),tab:"process",process:{
      start:{input1:"P",value1:1,input2:"T",value2:25,description:"Point 1"},
      steps:[
        {processType:"isobaric",targetType:"T",targetValue:100,description:"Heating at constant pressure"},
        {processType:"isentropic",targetType:"P",targetValue:5,description:"Isentropic pressure change"},
        {processType:"isenthalpic",targetType:"P",targetValue:1,description:"Throttling"}
      ]
    }},true);
  });

  root.querySelector("#cp-process-run")?.addEventListener("click",async()=>{
    const process=readProcess();
    const target=root.querySelector("#cp-process-results");
    target.innerHTML='<div class="viewer-loading">Calculating process…</div>';
    try{
      const engine=await getEngine();
      const rows=computeProcess(engine,{fluid:root.querySelector("#cp-fluid").value,...process,units:readUnits(root),bookBasis:root.querySelector("#cp-book-basis").checked});
      const flat=processRowsForExport(rows);
      target.innerHTML=genericTable(flat);
      save({...syncGlobal(),process,exportRows:flat,exportName:"coolprop-process"},false);
      setDiagramStates(rows.filter(row=>row.status==="OK").map(row=>row.state),"Process");
    }catch(error){
      target.innerHTML=`<div class="geometry-warning"><strong>Process error</strong><span>${esc(error?.message||error)}</span></div>`;
    }
  });

  root.querySelector("#cp-explore-example")?.addEventListener("click",()=>{
    save({...syncGlobal(),tab:"explore",explore:{input1:"T",value1:25,input2:"P",value2:1}},true);
  });

  root.querySelector("#cp-explore-run")?.addEventListener("click",async()=>{
    const explore={
      input1:root.querySelector("#cp-explore-i1")?.value||"T",
      value1:numericInput(root.querySelector("#cp-explore-v1")),
      input2:root.querySelector("#cp-explore-i2")?.value||"P",
      value2:numericInput(root.querySelector("#cp-explore-v2"))
    };
    const target=root.querySelector("#cp-explore-results");
    target.innerHTML='<div class="viewer-loading">Fetching properties…</div>';
    try{
      const engine=await getEngine();
      const result=computeState(engine,{fluid:root.querySelector("#cp-fluid").value,...explore,units:readUnits(root),bookBasis:root.querySelector("#cp-book-basis").checked});
      target.innerHTML=resultGrid(result,readUnits(root));
      save({...syncGlobal(),explore,exportRows:stateRowsForExport(result),exportName:"coolprop-all-data"},false);
    }catch(error){
      target.innerHTML=`<div class="geometry-warning"><strong>Explore error</strong><span>${esc(error?.message||error)}</span></div>`;
    }
  });

  root.querySelector("#cp-single-diagram")?.addEventListener("click",()=>showDiagram("single"));
  root.querySelector("#cp-batch-diagram")?.addEventListener("click",()=>showDiagram("batch"));
  root.querySelector("#cp-process-diagram")?.addEventListener("click",()=>showDiagram("process"));

  for(const selector of ["#cp-diagram-type","#cp-diagram-isotherms","#cp-diagram-isobars","#cp-diagram-quality"]){
    root.querySelector(selector)?.addEventListener("change",async()=>{
      if(!s.diagram.states.length)return;
      s=normalizedState({...s,diagram:{...s.diagram,...diagramState(),visible:true}});
      onState(s,false);
      await mountDiagram(s.diagram);
    });
  }
  root.querySelector("#cp-diagram-reset")?.addEventListener("click",()=>diagramHandle?.reset?.());
  root.querySelector("#cp-diagram-png")?.addEventListener("click",()=>diagramHandle?.downloadPNG?.("coolprop-"+(s.diagram.type||"diagram")+".png"));
  root.querySelector("#cp-diagram-close")?.addEventListener("click",()=>{
    const section=root.querySelector("#cp-diagram-section");
    if(section)section.hidden=true;
    diagramHandle?.cleanup?.();
    diagramHandle=null;
    s=normalizedState({...s,diagram:{...s.diagram,visible:false}});
    onState(s,false);
  });

  if(s.diagram.visible&&s.diagram.states.length){
    mountDiagram(s.diagram).catch(error=>{
      const stage=root.querySelector("#cp-diagram-stage");
      if(stage)stage.textContent="Diagram error: "+String(error?.message||error);
    });
  }

  root.querySelector("#cp-export-csv")?.addEventListener("click",()=>{
    if(s.exportRows.length)downloadText((s.exportName||"coolprop-results")+".csv",rowsToCSV(s.exportRows),"text/csv;charset=utf-8");
  });
  root.querySelector("#cp-export-json")?.addEventListener("click",()=>{
    if(s.exportRows.length)downloadText((s.exportName||"coolprop-results")+".json",rowsToJSON(s.exportRows),"application/json;charset=utf-8");
  });

  return {cleanup(){diagramHandle?.cleanup?.();diagramHandle=null}};
}
