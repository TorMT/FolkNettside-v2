export const LEGACY_DIVERSE_BRIDGES={
  brewing:{
    title:"Brygging",
    kicker:"Diverse / Data",
    description:"Hydrometers, fermentation analysis, brewing logs, recipes and the existing SandalenTools integration remain available while the data and UI are migrated to native v2 modules.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/Brygging/"
  },
  medisin:{
    title:"MedisinTimer",
    kicker:"Diverse / Utility",
    description:"The existing timer, history, level curves, sync and calculation tools remain available inside the v2 shell while storage and UI are migrated.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/MedisinTimer/"
  },
  laos:{
    title:"LAOS",
    kicker:"Diverse / Archive",
    description:"The existing assignment view remains reachable in the v2 shell while its file-driven content is mapped into the shared Courses resource model.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/LAOS/"
  },
  andrekok:{
    title:"AndreKokSider",
    kicker:"Diverse / Study",
    description:"The existing student-site directory remains available while sorting, filters and links are moved into the shared v2 study surface.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/AndreKokSider/"
  }
};

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

export function legacyDiverseBridgeHTML(id){
  const item=LEGACY_DIVERSE_BRIDGES[id];
  if(!item)return "";
  return `<main class="diverse-page legacy-diverse-page">
    <header class="diverse-hero legacy-diverse-hero">
      <div>
        <span class="project-kicker">${esc(item.kicker)}</span>
        <h1>${esc(item.title)}</h1>
        <p>${esc(item.description)}</p>
      </div>
      <div class="legacy-diverse-actions">
        <button class="btn" data-go="/diverse">Back to Diverse</button>
        <a class="btn primary" href="${esc(item.legacyUrl)}" target="_blank" rel="noopener">Open direct</a>
      </div>
    </header>
    <section class="legacy-diverse-shell">
      <div class="legacy-diverse-note"><strong>Migration bridge</strong><span>The working legacy app is embedded unchanged. v2 owns navigation and appearance around it until native feature parity is verified.</span></div>
      <iframe class="legacy-diverse-frame" src="${esc(item.legacyUrl)}" title="${esc(item.title)} legacy app" loading="eager"></iframe>
      <p class="legacy-diverse-fallback">If the source blocks embedded use or browser storage, <a href="${esc(item.legacyUrl)}" target="_blank" rel="noopener">open the preserved app directly</a>.</p>
    </section>
  </main>`;
}
