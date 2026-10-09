import {courseExerciseResources,distinctValues,filterKokSites,filterLAOSAssignments,safeCatalogUrl,validateDiverseCatalog} from "./study-catalog-core.js?v=5e763f2ce07324d38c9a287cf3b76d2bb7447b30";
const URLS={
  laos:{data:"./data/diverse/laos-assignments.json",legacy:"https://tormt.folk.ntnu.no/diverse/LAOS/"},
  kok:{data:"./data/diverse/kok-sites.json",legacy:"https://tormt.folk.ntnu.no/diverse/AndreKokSider/"}
};
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const esc=escapeHTML;
const btn=(label,attr)=>`<button type="button" class="btn" ${attr}>${esc(label)}</button>`;
export function studyCatalogPageHTML(kind){
  const kok=kind==="kok";
  if(!URLS[kind])throw new Error("Unknown catalog module");
  const title=kok?"AndreKokSider":"LAOS";
  const subtitle=kok?"Oversikt over studentenes koksider, med filtrering etter studie, spesialisering og årskull.":"Øvinger og obligatoriske ressurser samlet i den vanlige v2-studieflaten.";
  const filterFields=kok?`
    <label>Studie<select id="catalog-study"><option value="all">Alle studier</option></select></label>
    <label>Spesialisering<select id="catalog-specialization"><option value="all">Alle spesialiseringer</option></select></label>
    <label>Årskull<select id="catalog-cohort"><option value="all">Alle årskull</option></select></label>
    <label>Sorter<select id="catalog-sort"><option value="name">Alfabetisk</option><option value="cohort">Årskull</option><option value="rating">Rating</option></select></label>`:
    `<label>Emne<select id="catalog-course"><option value="all">Alle emner</option></select></label>`;
  return `<main class="diverse-page study-catalog-page" data-study-catalog="${kind}">
    <header class="diverse-hero">
      <div><span class="project-kicker">Diverse / Study</span><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="legacy-diverse-actions">
        ${btn("Til Diverse",'data-study-catalog-back')}
        <a class="btn" href="${URLS[kind].legacy}" target="_blank" rel="noopener noreferrer">Opprinnelig kilde ↗</a>
      </div>
    </header>
    <section class="study-catalog-shell">
      <div class="study-catalog-info" id="catalog-provenance" role="status">Leser tilgjengelige katalogdata …</div>
      <div class="study-catalog-toolbar">
        <label class="catalog-search">Søk<input id="catalog-search" type="search" placeholder="${kok?"Søk etter side eller studie …":"Søk etter øving eller emne …"}" autocomplete="off"></label>
        ${filterFields}
      </div>
      <details class="study-catalog-import-tools"><summary>Katalogverktøy (JSON)</summary>
      <div class="study-catalog-toolbar study-catalog-import">
        <div><strong>Importer lokalt utdrag</strong><small>Vis en alternativ JSON-katalog i denne nettleseren. Dette endrer ikke den publiserte listen.</small></div>
        ${btn("Åpne JSON-uttrekk",'data-catalog-upload')}
        ${btn("Gjenopprett publisert katalog",'data-catalog-reset')}
        <input id="catalog-import-file" type="file" accept=".json,application/json" hidden>
      </div></details>
      <div class="study-catalog-result-head"><strong id="catalog-count">—</strong><span id="catalog-status"></span></div>
      <div class="study-catalog-results" id="catalog-results" aria-live="polite"></div>
      ${!kok?`<details class="study-catalog-welcome" id="catalog-welcome" hidden><summary>Vis originalt LAOS-velkomstbilde</summary><img id="catalog-welcome-image" loading="lazy" alt="Originalt LAOS-velkomstbilde"></details>`:""}
      ${!kok?`<section class="study-catalog-course-section"><h2>Øvingsfiler i Courses</h2>
       <p class="muted">Viser øvings- og obligatoriske ressurser som allerede finnes i v2-manifestet. Dette er ikke nødvendigvis den gamle LAOS-samlingen.</p>
       <div id="catalog-course-resources" class="study-catalog-results"></div></section>`:""}
    </section>
  </main>`;
}
function options(select,values,label){
  if(!select)return;
  const previous=select.value;
  select.replaceChildren(new Option(label,"all"));
  values.forEach(value=>select.add(new Option(value,value)));
  if([...select.options].some(option=>option.value===previous))select.value=previous;
}
function renderCards(entries,{kind,onNavigate}){
  return entries.map(item=>{
    const external=Boolean(item.url);
    const href=external?safeCatalogUrl(item.url,{allowRelative:kind==="laos"}):"";
    if(external&&!href)return "";
    const metadata=kind==="kok"?[item.study,item.specialization,item.cohort?("Klasse "+item.cohort):"",
      item.rating===null?"":("Rating "+item.rating+"/"+(item.ratingScale||5))]:[item.courseCode,item.semester?("Semester "+item.semester):"",item.category];
    const link=external?`<a class="btn" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Åpne side ↗</a>`:
      (onNavigate&&item.route?`<button type="button" class="btn" data-catalog-route="${esc(item.route)}">Åpne i Viewer</button>`:"");
    return `<article class="study-catalog-card"><div class="study-catalog-card-main">
      <h3>${esc(item.name)}</h3>${item.description?`<p class="study-catalog-description">${esc(item.description)}</p>`:""}<div class="study-catalog-chips">${metadata.filter(Boolean).map(value=>`<span>${esc(value)}</span>`).join("")}</div>
      ${item.source?`<small>Kilde: ${esc(item.source)}</small>`:""}</div>
      <div class="study-catalog-card-actions">${link}</div></article>`;
  }).join("");
}
export async function mountStudyCatalog(root,{kind,semesters=[],onBack=()=>{},onNavigate=()=>{}}={}){
  if(!URLS[kind])throw new Error("Unknown study catalog");
  const input=root.querySelector("#catalog-search"),list=root.querySelector("#catalog-results");
  const provenance=root.querySelector("#catalog-provenance"),count=root.querySelector("#catalog-count");
  const status=root.querySelector("#catalog-status"),fileInput=root.querySelector("#catalog-import-file");
  const courseList=root.querySelector("#catalog-course-resources");
  const ac=new AbortController();
  let current={items:[],verified:false,source:"",sourceUrl:""},published=null,disposed=false,localPreview=false;
  const values=()=>({
    query:input.value.trim(),
    study:root.querySelector("#catalog-study")?.value??"all",
    specialization:root.querySelector("#catalog-specialization")?.value??"all",
    cohort:root.querySelector("#catalog-cohort")?.value??"all",
    sort:root.querySelector("#catalog-sort")?.value??"name",
    course:root.querySelector("#catalog-course")?.value??"all"
  });
  function render(){
    if(disposed)return;
    const filters=values(),kok=kind==="kok";
    const items=kok?filterKokSites(current.items,filters):filterLAOSAssignments(current.items,filters);
    count.textContent=items.length+" av "+current.items.length+" katalogoppføringer";
    const welcome=root.querySelector("#catalog-welcome");
    if(welcome){
      welcome.hidden=!current.welcomeImage;
      const image=welcome.querySelector("img");
      if(current.welcomeImage&&image&&image.getAttribute("src")!==current.welcomeImage)image.setAttribute("src",current.welcomeImage);
    }
    provenance.textContent=!current.items.length?
      "Ingen katalogoppføringer tilgjengelig. Sjekk kildefilen og prøv på nytt.":
      current.verified&&!localPreview?"Katalog fra verifisert kilde: "+(current.source||"publisert uttrekk"):
        "Dette er et ikke-verifisert lokalt eller foreløpig uttrekk. Kontroller lenkene før du bruker dem.";
    list.innerHTML=items.length?renderCards(items,{kind,onNavigate}):`<div class="study-catalog-empty"><strong>${current.items.length?"Ingen treff.":"Katalogen er tom eller ikke tilgjengelig."}</strong>
      <p>${current.items.length?"Endre søk eller filtre.":"Sjekk datakilden eller prøv igjen senere."}</p></div>`;
    if(kok){
      options(root.querySelector("#catalog-study"),distinctValues(current.items,"study"),"Alle studier");
      options(root.querySelector("#catalog-specialization"),distinctValues(current.items.filter(item=>filters.study==="all"||item.study===filters.study),"specialization"),"Alle spesialiseringer");
      options(root.querySelector("#catalog-cohort"),distinctValues(current.items,"cohort"),"Alle årskull");
    }else options(root.querySelector("#catalog-course"),distinctValues(current.items,"courseCode"),"Alle emner");
  }
  function renderExercises(){
    if(!courseList)return;
    const entries=courseExerciseResources(semesters).filter(item=>{
      const q=input.value.trim().toLocaleLowerCase("nb-NO");
      return !q||(item.name+" "+item.courseCode).toLocaleLowerCase("nb-NO").includes(q);
    });
    courseList.innerHTML=entries.length?
      renderCards(entries,{kind:"laos",onNavigate}):
      '<div class="study-catalog-empty"><strong>Ingen tilsvarende ressurser funnet i Courses.</strong><p>Det betyr ikke at det gamle LAOS-arkivet er tomt.</p></div>';
  }
  function refresh(){render();renderExercises();}
  root.querySelector("[data-study-catalog-back]")?.addEventListener("click",onBack,{signal:ac.signal});
  root.querySelector("[data-catalog-upload]")?.addEventListener("click",()=>fileInput.click(),{signal:ac.signal});
  root.querySelector("[data-catalog-reset]")?.addEventListener("click",()=>{
    if(published){current=published;localPreview=false;status.textContent="Publisert katalog gjenopprettet.";refresh();}
  },{signal:ac.signal});
  root.addEventListener("click",event=>{
    const button=event.target.closest("[data-catalog-route]");
    if(button)onNavigate(button.dataset.catalogRoute);
  },{signal:ac.signal});
  fileInput.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    try{
      if(file.size>1024*1024)throw new Error("Maks 1 MB per katalog.");
      current=validateDiverseCatalog(JSON.parse(await file.text()),kind);
      localPreview=true;
      status.textContent="Lokalt importert "+current.items.length+" oppføringer, ingen endringer er publisert.";
      refresh();
    }catch(error){status.textContent="Importfeil: "+String(error?.message||error);}
    fileInput.value="";
  },{signal:ac.signal});
  input.addEventListener("input",refresh,{signal:ac.signal});
  ["study","specialization","cohort","sort","course"].forEach(key=>{
    root.querySelector("#catalog-"+key)?.addEventListener("change",refresh,{signal:ac.signal});
  });
  try{
    const response=await fetch(URLS[kind].data,{cache:"no-store",signal:ac.signal});
    if(!response.ok)throw new Error("HTTP "+response.status);
    published=validateDiverseCatalog(await response.json(),kind);
    if(!disposed){current=published;localPreview=false;status.textContent="V2-katalogen er lest.";refresh();}
  }catch(error){
    if(!disposed){status.textContent="Kunne ikke lese katalogfilen: "+String(error.message||error);refresh();}
  }
  return {cleanup(){disposed=true;ac.abort();}};
}
