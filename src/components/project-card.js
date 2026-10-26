function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

/** Only the owner's existing, public engineering portfolio media is embedded. */
export function projectImageURL(value){
  if(typeof value!=="string")return "";
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
  return `<a class="project-row project-row-link" data-project="${esc(project.slug)}"
      href="${esc(projectRoute(project.slug))}" aria-label="Åpne prosjekt: ${esc(project.title)}">
    <div class="project-art project-art-${esc(project.type)}">
      ${image?`<img class="project-card-image" data-project-image="card" src="${esc(image)}" alt="${esc(alt)}"
           loading="lazy" decoding="async" referrerpolicy="no-referrer">
        <span class="project-image-fallback" data-project-image-fallback hidden role="img"
          aria-label="${esc(alt)}">Bilde utilgjengelig · åpne prosjektet for beskrivelse</span>`:
        '<div class="project-art-mark" aria-hidden="true">⌁</div>'}
      <div class="project-type-badge">${esc(projectTypeLabel(project.type))}</div>
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
  const source=portfolioLink(project.sourceUrl);
  const demo=typeof project.demoRoute==="string"&&
    /^\/(?:tools|courses|diverse)(?:\/[a-z0-9-]+)*$/.test(project.demoRoute)
    ?project.demoRoute:null;
  return `<main class="project-detail">
    <nav class="crumbs"><a href="#/portfolio">← Portfolio</a> / Projects / ${esc(project.title)}</nav>
    <header class="project-detail-hero">
      <div>
        <span class="project-kicker">${esc(projectTypeLabel(project.type))}</span>
        <h1>${esc(project.title)}</h1>
        <p>${esc(project.summary)}</p>
        <div class="tags">${(project.skills||[]).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
        <div class="project-detail-links">
          ${demo?`<a class="btn primary" href="#${esc(demo)}">Prøv verktøy i V2 →</a>`:""}
          ${source?`<a class="btn" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Engineering Portfolio ↗</a>`:""}
          ${files}
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
       <p class="muted">Originalbilder fra Engineering Portfolio på NTNU.</p>
     </section>`:""}
    <section class="project-detail-grid">
      <article><h2>Problem</h2><p>${esc(project.problem||"Teknisk problem og bruksområde er dokumentert i prosjektbeskrivelsen.")}</p></article>
      <article><h2>Solution</h2><p>${esc(project.solution||"Se prosjektbeskrivelsen for teknisk løsning.")}</p></article>
      <article><h2>Process</h2>${list(project.process)}</article>
      <article><h2>Result</h2>${list(project.results)}</article>
    </section>
  </main>`;
}
