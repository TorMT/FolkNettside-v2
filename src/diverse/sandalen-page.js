const SANDALEN_LINKS=[
  {label:"Sandalen Gård",url:"https://sandalengard.no/",note:"Hovedside"},
  {label:"Vinmonopolet",url:"https://www.vinmonopolet.no/search?q=sandalen+g%C3%A5rd%3Arelevance",note:"Produkter og tilgjengelighet"},
  {label:"Untappd",url:"https://untappd.com/SandalenGrd",note:"Bryggeri- og ølprofil"}
];

export const SANDALEN_TOOLS_URL="https://tormt.folk.ntnu.no/diverse/SandalenG%C3%A5rd/filer/SandalenTools%20Inview.html";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

export function sandalenPageHTML(){
  return `<main class="diverse-page sandalen-page">
    <header class="diverse-hero sandalen-hero">
      <div>
        <span class="project-kicker">Diverse / Operations</span>
        <h1>Sandalen Gård</h1>
        <p>Native v2 hub for the Sandalen links, with the existing SandalenTools kept available in-view while the tool itself is migrated.</p>
      </div>
      <button class="btn" data-go="/diverse">Back to Diverse</button>
    </header>
    <section class="sandalen-link-grid">
      ${SANDALEN_LINKS.map(item=>`<a class="sandalen-link-card" href="${esc(item.url)}" target="_blank" rel="noopener">
        <span>${esc(item.note)}</span><strong>${esc(item.label)}</strong><em>Open ↗</em>
      </a>`).join("")}
    </section>
    <section class="sandalen-tools-shell">
      <div class="sandalen-tools-head">
        <div><span class="project-kicker">Preserved bridge</span><h2>SandalenTools</h2><p>The working tool remains embedded from the legacy deployment until its internals have native v2 parity.</p></div>
        <a class="btn" href="${SANDALEN_TOOLS_URL}" target="_blank" rel="noopener">Open direct</a>
      </div>
      <iframe class="sandalen-tools-frame" src="${SANDALEN_TOOLS_URL}" title="SandalenTools inview" loading="lazy"></iframe>
      <p class="sandalen-tools-fallback">If the embedded view is blocked by the source, use <a href="${SANDALEN_TOOLS_URL}" target="_blank" rel="noopener">Open direct</a>. The legacy source is intentionally left unchanged.</p>
    </section>
  </main>`;
}
