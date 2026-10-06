function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
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
  return `<article class="project-row project-row-link" data-project="${esc(project.slug)}">
    <div class="project-art project-art-${esc(project.type)}">
      <div class="project-type-badge">${esc(projectTypeLabel(project.type))}</div>
      <div class="project-art-mark">${project.type==="physical"?"⚙":"⌁"}</div>
    </div>
    <div class="project-copy">
      <h3>${esc(project.title)}</h3>
      <p>${esc(project.summary)}</p>
      <div class="tags">${(project.skills||[]).slice(0,4).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
    </div>
    <div class="project-meta">${esc(project.year)}<br>${esc(project.status)}</div>
  </article>`;
}

export function renderProjectDetail(project){
  const list=(items)=>`<ul>${(items||[]).map(item=>`<li>${esc(item)}</li>`).join("")}</ul>`;
  return `<main class="project-detail">
    <div class="crumbs">Portfolio / Projects / ${esc(project.title)}</div>
    <header class="project-detail-hero">
      <div>
        <span class="project-kicker">${esc(projectTypeLabel(project.type))}</span>
        <h1>${esc(project.title)}</h1>
        <p>${esc(project.summary)}</p>
        <div class="tags">${(project.skills||[]).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
      </div>
      <aside class="project-facts">
        <div><span>Year</span><strong>${esc(project.year)}</strong></div>
        <div><span>Status</span><strong>${esc(project.status)}</strong></div>
        <div><span>Tools</span><strong>${esc((project.tools||[]).join(", ")||"—")}</strong></div>
        <div><span>Materials</span><strong>${esc((project.materials||[]).join(", ")||"—")}</strong></div>
      </aside>
    </header>
    <section class="project-detail-grid">
      <article><h2>Problem</h2><p>${esc(project.problem)}</p></article>
      <article><h2>Solution</h2><p>${esc(project.solution)}</p></article>
      <article><h2>Process</h2>${list(project.process)}</article>
      <article><h2>Result</h2>${list(project.results)}</article>
    </section>
    <section class="project-media-placeholder">
      <div><strong>Project media</strong><p>Photos, CAD renders, drawings, before/after images and files can be attached here.</p></div>
    </section>
  </main>`;
}
