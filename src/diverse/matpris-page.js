import {compareMatprisEan,groupProductsByEan,searchMatpris,matprisBackendAvailable} from "./matpris-api.js?v=a920f76a71f5bf0a9129b860814fef1d69b696b2";

const money=value=>Number.isFinite(Number(value))
  ?new Intl.NumberFormat("nb-NO",{style:"currency",currency:"NOK"}).format(Number(value))
  :"—";

const esc=value=>String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));

function offerLine(item){
  const unit=Number.isFinite(Number(item.unitPrice))?` · ${money(item.unitPrice)} / ${esc(item.weightUnit||"enhet")}`:"";
  return `<div class="matpris-offer">
    <span><strong>${esc(item.store.name)}</strong>${item.store.code?`<small>${esc(item.store.code)}</small>`:""}</span>
    <span><strong>${money(item.price)}</strong><small>${unit||"Pris per vare"}</small></span>
  </div>`;
}

function renderGroups(groups){
  if(!groups.length)return '<div class="matpris-empty"><strong>Ingen treff</strong><span>Prøv et bredere produktnavn eller EAN.</span></div>';
  return groups.map(group=>{
    const cheapest=group.cheapest;
    return `<article class="matpris-product">
      <div class="matpris-product-main">
        <span class="project-kicker">${esc(group.brand||group.vendor||"Produkt")}</span>
        <h3>${esc(group.name)}</h3>
        <p>${group.ean?`EAN ${esc(group.ean)} · `:""}${group.storeCount} butikk${group.storeCount===1?"":"er"} i søkeresultatet</p>
      </div>
      <div class="matpris-product-price"><span>Fra</span><strong>${money(cheapest?.price)}</strong><small>${esc(cheapest?.store?.name||"")}</small></div>
      <div class="matpris-product-actions">
        ${group.ean?`<button class="btn" data-matpris-compare="${esc(group.ean)}">Sammenlign butikker</button><button class="btn" data-matpris-add="${esc(group.ean)}" data-name="${esc(group.name)}">Legg i liste</button>`:""}
      </div>
    </article>`;
  }).join("");
}

function loadList(){
  try{return JSON.parse(localStorage.getItem("matpris.shortlist.v1")||"[]")}catch{return []}
}
function saveList(list){localStorage.setItem("matpris.shortlist.v1",JSON.stringify(list.slice(0,100)))}
function renderList(root,list){
  const holder=root.querySelector("#matpris-list");
  if(!holder)return;
  holder.innerHTML=list.length?list.map(item=>`<button class="matpris-list-item" data-matpris-compare="${esc(item.ean)}"><span>${esc(item.name)}</span><small>${esc(item.ean)}</small></button>`).join("")
    :'<div class="matpris-empty compact"><span>Ingen produkter lagret ennå.</span></div>';
}

export function matprisPageHTML(){
  return `<main class="diverse-page matpris-page">
    <header class="diverse-hero matpris-hero">
      <div><span class="project-kicker">Diverse / Utility</span><h1>Matprissøk</h1><p>Søk i norske dagligvarer og sammenlign reelle butikkpriser på samme EAN. API-nøkkelen ligger kun på serveren.</p></div>
      <button class="btn" data-go="/diverse">Back to Diverse</button>
    </header>
    <section class="matpris-workspace">
      <div class="matpris-main">
        <form id="matpris-search-form" class="matpris-search">
          <label><span>Produkt eller EAN</span><input id="matpris-query" type="search" autocomplete="off" placeholder="f.eks. Pepsi Max 1,5l"></label>
          <label><span>Sorter</span><select id="matpris-sort"><option value="price_asc">Laveste pris</option><option value="name_asc">Navn A–Å</option><option value="date_desc">Nyest oppdatert</option></select></label>
          <button class="btn primary" type="submit">Søk</button>
        </form>
        <div id="matpris-status" class="matpris-status">Klar. Søk sendes via serverproxy; ingen API-nøkkel legges i nettleseren.</div>
        <div id="matpris-results" class="matpris-results"></div>
      </div>
      <aside class="matpris-side">
        <section class="matpris-compare-card"><div class="hydro-curve-head"><span>Butikkpriser</span><span class="muted">EAN-match</span></div><div id="matpris-compare"><div class="matpris-empty"><span>Velg et produkt for å sammenligne butikker.</span></div></div></section>
        <section class="matpris-list-card"><div class="hydro-curve-head"><span>Handleliste</span><button class="btn" id="matpris-clear-list" type="button">Tøm</button></div><div id="matpris-list"></div></section>
      </aside>
    </section>
  </main>`;
}

export function mountMatpris(root,options={}){
  const form=root.querySelector("#matpris-search-form");
  if(!form)return ()=>{};
  const query=root.querySelector("#matpris-query");
  const sort=root.querySelector("#matpris-sort");
  const status=root.querySelector("#matpris-status");
  const results=root.querySelector("#matpris-results");
  const compare=root.querySelector("#matpris-compare");
  let activeController=null;
  let shortlist=loadList();
  renderList(root,shortlist);
  const backendAvailable=matprisBackendAvailable({
    hostname:globalThis.location?.hostname,endpoint:options.endpoint
  });
  if(!backendAvailable){
    status.textContent="Prissøk er ikke tilgjengelig på GitHub Pages. Ingen API-nøkkel eksponeres; åpne den server-hostede versjonen når PHP-backenden er konfigurert.";
    status.dataset.kind="error";
    form.querySelector('button[type="submit"]').disabled=true;
    form.querySelector('button[type="submit"]').title="Matpris krever serverproxy";
  }

  const setStatus=(message,kind="")=>{status.textContent=message;status.dataset.kind=kind};
  async function runSearch(){
    if(!backendAvailable)return;
    const q=query.value.trim();
    if(q.length<2){setStatus("Skriv minst to tegn.","error");return}
    activeController?.abort();
    activeController=new AbortController();
    results.innerHTML='<div class="matpris-empty"><span>Henter priser…</span></div>';
    setStatus("Henter produktdata…","loading");
    try{
      const response=await searchMatpris(q,{sort:sort.value,signal:activeController.signal,fetchImpl:options.fetchImpl,endpoint:options.endpoint});
      const groups=groupProductsByEan(response.products);
      results.innerHTML=renderGroups(groups);
      setStatus(`${response.products.length} prisoppføringer · ${groups.length} produktgrupper`,"ok");
      if(globalThis.history&&globalThis.location){
        const url=new URL(location.href);url.searchParams.set("q",q);history.replaceState(null,"",url);
      }
    }catch(error){
      if(error?.name==="AbortError")return;
      results.innerHTML='<div class="matpris-empty"><strong>Kunne ikke hente priser</strong><span>'+esc(error?.message||error)+'</span></div>';
      setStatus("Backend ikke tilgjengelig. På GitHub Pages-preview er dette forventet til serverproxyen er deployet.","error");
    }
  }

  async function runCompare(ean){
    if(!backendAvailable){
      compare.textContent="Butikkpriser krever en aktiv serverproxy; handlelisten din beholdes lokalt.";
      return;
    }
    compare.innerHTML='<div class="matpris-empty"><span>Henter butikker…</span></div>';
    try{
      const response=await compareMatprisEan(ean,{fetchImpl:options.fetchImpl,endpoint:options.endpoint});
      const items=response.products.filter(item=>item.price!==null).sort((a,b)=>a.price-b.price);
      compare.innerHTML=items.length
        ?`<div class="matpris-compare-head"><strong>${esc(items[0].name)}</strong><span>EAN ${esc(ean)} · billigst først</span></div>${items.map(offerLine).join("")}`
        :'<div class="matpris-empty"><span>Ingen butikkpriser funnet for denne EAN-en.</span></div>';
    }catch(error){
      compare.innerHTML='<div class="matpris-empty"><strong>Sammenligning feilet</strong><span>'+esc(error?.message||error)+'</span></div>';
    }
  }

  form.addEventListener("submit",event=>{event.preventDefault();runSearch()});
  root.addEventListener("click",event=>{
    const compareButton=event.target.closest("[data-matpris-compare]");
    if(compareButton){runCompare(compareButton.dataset.matprisCompare);return}
    const addButton=event.target.closest("[data-matpris-add]");
    if(addButton){
      const item={ean:addButton.dataset.matprisAdd,name:addButton.dataset.name||addButton.dataset.matprisAdd};
      if(!shortlist.some(entry=>entry.ean===item.ean)){shortlist.push(item);saveList(shortlist);renderList(root,shortlist)}
    }
  });
  root.querySelector("#matpris-clear-list")?.addEventListener("click",()=>{shortlist=[];saveList(shortlist);renderList(root,shortlist)});

  const initial=globalThis.location?new URL(location.href).searchParams.get("q"):"";
  if(initial){query.value=initial;queueMicrotask(runSearch)}
  return ()=>activeController?.abort();
}
