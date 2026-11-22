function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

const LOCAL_DEMO_IMAGE=/^\.\/assets\/demos\/[a-z0-9][a-z0-9-]*\/img\/[a-z0-9][a-z0-9-]*\.(?:png|jpe?g|webp)$/;
const LOCAL_DEMO_FILE=/^\.\/assets\/demos\/[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*\.(?:html|zip)$/;
/** Images from the owner's public engineering portfolio, or checked-in demo images in this repository. */
export function projectImageURL(value){
  if(typeof value!=="string")return "";
  if(LOCAL_DEMO_IMAGE.test(value))return value;
  try{
    const url=new URL(value);
    return url.origin==="https://tormt.folk.ntnu.no"&&
      /^\/diverse\/portfolio\/screenshots\/[a-z0-9][a-z0-9-]*\.(?:png|jpe?g|webp)$/i.test(url.pathname)&&
      !url.search&&!url.hash?url.href:"";
  }catch{return ""}
}
function portfolioLink(value){
  try{
    const url=new URL(value);
    return url.origin==="https://tormt.folk.ntnu.no"&&
      /^\/diverse\/portfolio\/(?:files\/[a-z0-9][a-z0-9-]*\.pdf)?$/i.test(url.pathname)?
      url.href:"";
  }catch{return ""}
}
/** A checked-in demo page or download in this repository (no query, fragment or parent paths). */
export function projectLocalFileURL(value){
  return typeof value==="string"&&LOCAL_DEMO_FILE.test(value)?value:"";
}
/** In-site route that opens a checked-in example model in the CAD workbench. */
export function projectModelRoute(value){
  return typeof value==="string"&&/^#\/engineering\/cad\/[a-z0-9][a-z0-9-]*$/.test(value)?value:"";
}
/** Only checked-in demo pages that run entirely in the browser can be embedded. */
export function projectEmbedURL(value){
  return typeof value==="string"&&/^\.\/assets\/demos\/[a-z0-9][a-z0-9-]*\/simulator\.html$/.test(value)?value:"";
}
/** Only this checked-in, public, owner-provided model can be embedded. */
export function projectModelURL(value){
  return value==="./assets/pitch-drive/planetgirdrift-3d.html"?value:"";
}
function projectRoute(slug){
  return "#/projects/"+encodeURIComponent(String(slug||""));
}
export function projectTypeLabel(type){
  return ({
    physical:"Physical engineering",
    design:"Design",
    analysis:"Analysis",
    software:"Software"
  })[type] || type;
}

export function renderProjectCard(project){
  const image=projectImageURL(project.coverImage||project.gallery?.[0]?.src);
  const alt=project.gallery?.[0]?.alt||project.title+" project image";
  return `<a class="project-row project-row-link${project.current===true?" project-row-current":""}" data-project="${esc(project.slug)}"
      href="${esc(projectRoute(project.slug))}" aria-label="Åpne prosjekt: ${esc(project.title)}">
    <div class="project-art project-art-${esc(project.type)}">
      ${image?`<img class="project-card-image" data-project-image="card" src="${esc(image)}" alt="${esc(alt)}"
           loading="lazy" decoding="async" referrerpolicy="no-referrer">
        <span class="project-image-fallback" data-project-image-fallback hidden role="img"
          aria-label="${esc(alt)}">Bilde utilgjengelig · åpne prosjektet for beskrivelse</span>`:
        '<div class="project-art-mark" aria-hidden="true">⌁</div>'}
      <div class="project-type-badge">${esc(projectTypeLabel(project.type))}</div>
      ${project.current===true?'<div class="project-current-badge">Pågående</div>':""}
    </div>
    <div class="project-copy">
      <h3>${esc(project.title)}</h3>
      <p>${esc(project.summary)}</p>
      <div class="tags">${(project.skills||[]).slice(0,4).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
    </div>
    <div class="project-meta">${esc(project.year)}<br>${esc(project.status)}<span class="project-open">Se prosjekt →</span></div>
  </a>`;
}

export function renderProjectDetail(project){
  const list=(items)=>`<ul>${(items||[]).map(item=>`<li>${esc(item)}</li>`).join("")}</ul>`;
  const gallery=(project.gallery||[]).map(item=>{
    const src=projectImageURL(item?.src);
    return src?`<figure class="project-gallery-item">
       <a href="${esc(src)}" target="_blank" rel="noopener noreferrer" aria-label="Åpne bildet ${esc(item.alt||project.title)}">
         <img data-project-image="gallery" src="${esc(src)}" alt="${esc(item.alt||project.title)}"
           loading="lazy" decoding="async" referrerpolicy="no-referrer">
       </a>
       <div class="project-image-fallback" data-project-image-fallback hidden role="img"
         aria-label="${esc(item.alt||project.title)}">Prosjektbildet kunne ikke lastes. Prosjektinformasjonen nedenfor er fortsatt tilgjengelig.</div>
       <figcaption>${esc(item.caption||"Project image")}</figcaption>
     </figure>`:"";
  }).filter(Boolean).join("");
  const files=(project.files||[]).map(item=>{
    const href=portfolioLink(item.url);
    return href?`<a class="btn" href="${esc(href)}" target="_blank"
        rel="noopener noreferrer">${esc(item.label||"Prosjektfil")} ↗</a>`:"";
  }).filter(Boolean).join("");
  const links=(project.links||[]).map(item=>{
    const route=projectModelRoute(item?.url);
    if(route)return `<a class="btn${item.primary?" primary":""}" href="${esc(route)}">${esc(item.label||"Åpne 3D")}</a>`;
    const href=projectLocalFileURL(item?.url);
    return href?`<a class="btn${item.primary?" primary":""}" href="${esc(href)}"${href.endsWith(".zip")?" download":' target="_blank" rel="noopener"'}>${esc(item.label||"Åpne")}${href.endsWith(".zip")?"":" ↗"}</a>`:"";
  }).filter(Boolean).join("");
  const embeds=(project.embeds||[]).map(item=>{
    const src=projectEmbedURL(item?.src);
    return src?`<section class="project-model project-embed" aria-label="${esc(item.title||"Simulator")}">
      <h2>${esc(item.title||"Simulator")}</h2>
      ${item.text?`<p>${esc(item.text)}</p>`:""}
      <iframe class="project-model-frame project-embed-frame" src="${esc(src)}" title="${esc(item.title||"Simulator")}"
        loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer" allowfullscreen></iframe>
      <p class="project-model-note"><a href="${esc(src)}" target="_blank" rel="noopener">Åpne i full skjerm ↗</a></p>
    </section>`:"";
  }).filter(Boolean).join("");
  const logRows=(project.log||[]).filter(item=>item&&item.title).map(item=>`<tr><td>${esc(item.date)}</td><td>${esc(item.title)}</td><td>${esc(item.result||"")}</td></tr>`).join("");
  const logHref=projectLocalFileURL(project.logUrl);
  const log=logRows?`<section class="project-model project-log" aria-label="Prosjektlogg">
      <h2>Prosjektlogg</h2>
      <div class="project-log-wrap"><table class="project-log-table"><thead><tr><th>Dato</th><th>Hva</th><th>Resultat</th></tr></thead><tbody>${logRows}</tbody></table></div>
      ${logHref?`<p class="project-model-note"><a href="${esc(logHref)}" target="_blank" rel="noopener">Hele loggen med utregninger og koblingsskjema ↗</a></p>`:""}
    </section>`:"";
  const next=(project.next||[]).length?`<section class="project-model project-next" aria-label="Dette gjenstår">
      <h2>Dette gjenstår</h2>${list(project.next)}
    </section>`:"";
  const modelURL=projectModelURL(project.modelURL);
  const source=portfolioLink(project.sourceUrl);
  const demo=typeof project.demoRoute==="string"&&
    /^\/(?:tools|courses|diverse)(?:\/[a-z0-9-]+)*$/.test(project.demoRoute)
    ?project.demoRoute:null;
  return `<main class="project-detail">
    <nav class="crumbs"><a href="#/portfolio">← Portfolio</a> / Projects / ${esc(project.title)}</nav>
    <header class="project-detail-hero">
      <div>
        <span class="project-kicker">${esc(projectTypeLabel(project.type))}${project.current===true?" · Pågående prosjekt":""}</span>
        <h1>${esc(project.title)}</h1>
        <p>${esc(project.summary)}</p>
        <div class="tags">${(project.skills||[]).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
        <div class="project-detail-links">
          ${demo?`<a class="btn primary" href="#${esc(demo)}">Prøv verktøy i V2 →</a>`:""}
          ${source?`<a class="btn" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Engineering Portfolio ↗</a>`:""}
          ${links}
          ${files}
          ${modelURL?`<a class="btn primary" href="${esc(modelURL)}" target="_blank" rel="noopener noreferrer">Full modell ↗</a>`:""}
        </div>
      </div>
      <aside class="project-facts">
        <div><span>Year</span><strong>${esc(project.year)}</strong></div>
        <div><span>Status</span><strong>${esc(project.status)}</strong></div>
        <div><span>Tools</span><strong>${esc((project.tools||[]).join(", ")||"—")}</strong></div>
        <div><span>Materials</span><strong>${esc((project.materials||[]).join(", ")||"—")}</strong></div>
      </aside>
    </header>
    ${gallery?`<section class="project-gallery" aria-label="Bilder fra prosjektet">
       <h2>Prosjektbilder</h2><div class="project-gallery-grid">${gallery}</div>
       ${(project.gallery||[]).some(item=>/^https:/.test(item?.src||""))?'<p class="muted">Originalbilder fra Engineering Portfolio på NTNU.</p>':""}
     </section>`:""}
    ${modelURL?`<section class="project-model" aria-label="Interaktiv pitch drive-modell">
      <h2>Full modell</h2>
      <p>Roter, zoom og velg komponenter for å inspisere motor, brems, planetgir, aksler, lagre og ringgir.</p>
      <iframe class="project-model-frame" src="${esc(modelURL)}" title="Interaktiv 3D-modell av pitch drive"
        loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer" allowfullscreen></iframe>
      ${project.modelNote?`<p class="project-model-note">${esc(project.modelNote)}</p>`:""}
    </section>`:""}
    ${embeds}
    ${log}
    <section class="project-detail-grid">
      <article><h2>Problem</h2><p>${esc(project.problem||"Teknisk problem og bruksområde er dokumentert i prosjektbeskrivelsen.")}</p></article>
      <article><h2>Solution</h2><p>${esc(project.solution||"Se prosjektbeskrivelsen for teknisk løsning.")}</p></article>
      <article><h2>Process</h2>${list(project.process)}</article>
      <article><h2>Result</h2>${list(project.results)}</article>
    </section>
    ${next}
  </main>`;
}
