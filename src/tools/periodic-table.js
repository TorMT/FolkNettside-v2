import {categories,enrichElement,filterElements,propertyValue,stateAtTemperature} from "./periodic-table-core.js";

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
  const temperature=Number(state.temperature)||298;
  const selectedNumber=Number(state.selected)||null;
  const filtered=filterElements(elements,{search,phase,category});
  const visible=new Set(filtered.map(item=>item.number));
  const selected=elements.find(item=>item.number===selectedNumber)||null;
  const cats=categories(elements);

  const cells=elements.map(element=>{
    const isVisible=visible.has(element.number);
    const phaseAtTemp=stateAtTemperature(element,temperature);
    return `<button class="periodic-element ${isVisible?"":"filtered"} ${selected?.number===element.number?"selected":""}" data-element="${element.number}" style="grid-column:${element.group};grid-row:${element.period}">
      <span class="periodic-number">${element.number}</span>
      <strong>${esc(element.symbol)}</strong>
      <small>${esc(element.name)}</small>
      <span class="periodic-phase phase-${phaseAtTemp}">${phaseAtTemp}</span>
    </button>`;
  }).join("");

  const detail=selected?`
    <aside class="periodic-detail">
      <div class="periodic-detail-symbol">${esc(selected.symbol)}</div>
      <div><h2>${esc(selected.name)}</h2><p class="muted">Atomic number ${selected.number} · ${esc(selected.category)} · ${esc(selected.crystal_structure)}</p></div>
      <div class="hydro-grid">
        <div><span class="muted">Atomic mass</span><strong>${propertyValue(selected,"atomic_mass")??"—"} u</strong></div>
        <div><span class="muted">Density</span><strong>${propertyValue(selected,"density")??"—"} g/cm³</strong></div>
        <div><span class="muted">Melting point</span><strong>${propertyValue(selected,"melt")??"—"} K</strong></div>
        <div><span class="muted">Boiling point</span><strong>${propertyValue(selected,"boil")??"—"} K</strong></div>
        <div><span class="muted">Electronegativity</span><strong>${propertyValue(selected,"electronegativity_pauling")??"—"}</strong></div>
        <div><span class="muted">Electron configuration</span><strong>${esc(selected.electron_configuration||"—")}</strong></div>
      </div>
    </aside>`:"";

  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / Periodic table</div>
    <header class="tool-header">
      <div><span class="project-kicker">Chemistry tool</span><h1>Periodic table</h1><p>Data-driven table with local fixture data, filtering and temperature-dependent phase indication.</p></div>
    </header>
    <section class="periodic-controls">
      <label class="field"><span>Search</span><input id="periodic-search" value="${esc(search)}" placeholder="Name, symbol, category..."></label>
      <label class="field"><span>Category</span><select id="periodic-category"><option value="all">All</option>${cats.map(value=>`<option value="${esc(value)}" ${value===category?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
      <label class="field"><span>Phase</span><select id="periodic-phase"><option value="all">All</option>${["solid","liquid","gas"].map(value=>`<option value="${value}" ${value===phase?"selected":""}>${value}</option>`).join("")}</select></label>
      <label class="field"><span>Temperature</span><div><input id="periodic-temperature" type="number" min="1" step="1" value="${temperature}"><span>K</span></div></label>
    </section>
    <div class="periodic-meta">${filtered.length} / ${elements.length} fixture elements visible</div>
    <section class="periodic-table-wrap"><div class="periodic-table">${cells}</div></section>
    ${detail}
  </main>`;
}
