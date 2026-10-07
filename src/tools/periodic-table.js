import {PROPERTY_DEFINITIONS,categories,enrichElement,filterElements,formattedProperty,propertyValue,stateAtTemperature,uniqueValues} from "./periodic-table-core.js?v=37073bdccbae8ef597014f189f1d9859467ec0e6";

let fixturePromise;
export function loadPeriodicFixture(path="./data/periodic-table.json"){
  if(!fixturePromise){
    fixturePromise=fetch(path).then(async response=>{
      if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
      const payload=await response.json();
      const list=Array.isArray(payload)?payload:(payload.elements||[]);
      return list.map(enrichElement);
    });
  }
  return fixturePromise;
}

function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

export function periodicTableHTML(elements,state={}){
  const search=state.search||"";
  const phase=state.phase||"all";
  const category=state.category||"all";
  const material=state.material||"all";
  const period=state.period||"all";
  const group=state.group||"all";
  const crystal=state.crystal||"all";
  const property=state.property||"atomic_mass";
  const quick=state.quick||"";
  const temperature=Number(state.temperature)||298;
  const selectedNumber=Number(state.selected)||null;
  const filtered=filterElements(elements,{search,phase,category,material,period,group,crystal,quick});
  const visible=new Set(filtered.map(item=>item.number));
  const selected=elements.find(item=>item.number===selectedNumber)||null;
  const cats=categories(elements);
  const materials=uniqueValues(elements,"material_tag");
  const periods=uniqueValues(elements,"period",{numeric:true});
  const groups=uniqueValues(elements,"group",{numeric:true});
  const crystals=uniqueValues(elements,"crystal_structure");

  const cells=elements.map(element=>{
    const isVisible=visible.has(element.number);
    const phaseAtTemp=stateAtTemperature(element,temperature);
    return `<button class="periodic-element ${isVisible?"":"filtered"} ${selected?.number===element.number?"selected":""}" data-element="${element.number}" style="grid-column:${element.group};grid-row:${element.period}">
      <span class="periodic-number">${element.number}</span>
      <strong>${esc(element.symbol)}</strong>
      <small>${esc(element.name)}</small>
      <span class="periodic-property">${esc(formattedProperty(element,property))}</span>
      <span class="periodic-phase phase-${phaseAtTemp}">${phaseAtTemp}</span>
    </button>`;
  }).join("");

  const detail=selected?`
    <aside class="periodic-detail">
      <div class="periodic-detail-symbol">${esc(selected.symbol)}</div>
      <div><h2>${esc(selected.name)}</h2><p class="muted">Atomic number ${selected.number} · ${esc(selected.category)} · ${esc(selected.crystal_structure)}</p></div>
      <div class="hydro-grid">
        <div><span class="muted">Atomic mass</span><strong>${esc(formattedProperty(selected,"atomic_mass"))}</strong></div>
        <div><span class="muted">Density</span><strong>${esc(formattedProperty(selected,"density"))}</strong></div>
        <div><span class="muted">Atomic radius</span><strong>${esc(formattedProperty(selected,"atomic_radius"))}</strong></div>
        <div><span class="muted">Melting point</span><strong>${esc(formattedProperty(selected,"melt"))}</strong></div>
        <div><span class="muted">Boiling point</span><strong>${esc(formattedProperty(selected,"boil"))}</strong></div>
        <div><span class="muted">Electronegativity</span><strong>${esc(formattedProperty(selected,"electronegativity_pauling"))}</strong></div>
        <div><span class="muted">1st ionization</span><strong>${esc(formattedProperty(selected,"first_ionization"))}</strong></div>
        <div><span class="muted">Electron affinity</span><strong>${esc(formattedProperty(selected,"electron_affinity"))}</strong></div>
        <div><span class="muted">Electron configuration</span><strong>${esc(selected.electron_configuration||"—")}</strong></div>
      </div>
      ${selected.summary?`<p class="periodic-summary">${esc(selected.summary)}</p>`:""}
      <div class="periodic-detail-actions">
        <button class="btn" id="periodic-clear-selection">Clear selection</button>
        ${selected.source?`<a class="btn" href="${esc(selected.source)}" target="_blank" rel="noopener">Source / Wikipedia ↗</a>`:""}
      </div>
    </aside>`:"";

  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / Periodic table</div>
    <header class="tool-header">
      <div><span class="project-kicker">Chemistry tool</span><h1>Periodic table</h1><p>Data-driven table with local fixture data, filtering and temperature-dependent phase indication.</p></div>
    </header>
    <section class="periodic-quickbar" aria-label="Quick filters">
      ${[
        ["metal","Metals"],
        ["nonmetal","Non-metals"],
        ["stp-gas","STP gases"],
        ["bcc","BCC"],
        ["fcc","FCC"],
        ["radioactive","Radioactive"]
      ].map(([value,label])=>`<button data-periodic-quick="${value}" class="${quick===value?"active":""}">${label}</button>`).join("")}
      <button id="periodic-reset">Reset filters</button>
    </section>
    <section class="periodic-controls">
      <label class="field"><span>Search</span><input id="periodic-search" value="${esc(search)}" placeholder="Name, symbol, category..."></label>
      <label class="field"><span>Property</span><select id="periodic-property">${Object.entries(PROPERTY_DEFINITIONS).map(([key,definition])=>`<option value="${key}" ${key===property?"selected":""}>${esc(definition.label)}</option>`).join("")}</select></label>
      <label class="field"><span>Category</span><select id="periodic-category"><option value="all">All</option>${cats.map(value=>`<option value="${esc(value)}" ${value===category?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
      <label class="field"><span>Material</span><select id="periodic-material"><option value="all">All</option>${materials.map(value=>`<option value="${esc(value)}" ${value===material?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
      <label class="field"><span>Period</span><select id="periodic-period"><option value="all">All</option>${periods.map(value=>`<option value="${value}" ${String(value)===String(period)?"selected":""}>${value}</option>`).join("")}</select></label>
      <label class="field"><span>Group</span><select id="periodic-group"><option value="all">All</option>${groups.map(value=>`<option value="${value}" ${String(value)===String(group)?"selected":""}>${value}</option>`).join("")}</select></label>
      <label class="field"><span>Phase</span><select id="periodic-phase"><option value="all">All</option>${["solid","liquid","gas"].map(value=>`<option value="${value}" ${value===phase?"selected":""}>${value}</option>`).join("")}</select></label>
      <label class="field"><span>Crystal</span><select id="periodic-crystal"><option value="all">All</option>${crystals.map(value=>`<option value="${esc(value)}" ${value===crystal?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
      <label class="field"><span>Temperature</span><div><input id="periodic-temperature" type="number" min="1" step="1" value="${temperature}"><span>K</span></div></label>
    </section>
    <div class="periodic-meta">${filtered.length} / ${elements.length} elements visible · ${esc(PROPERTY_DEFINITIONS[property]?.label||property)}</div>
    <section class="periodic-table-wrap"><div class="periodic-table">${cells}</div></section>
    ${detail}
  </main>`;
}
