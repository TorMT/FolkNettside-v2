import {visibleTools} from "./tool-registry.js?v=45f0c87cf82a120173ca472434b0924971b680b7";

function parityLabel(tool){
  if(tool.parity==="full")return "Parity: full";
  if(tool.parity==="review")return "Parity: review";
  return tool.route?"Parity: partial":"Legacy preserved";
}

export function toolsIndexHTML(){
  const tools=visibleTools();
  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools</div>
    <header class="tool-header">
      <div><span class="project-kicker">Shared tools</span><h1>Engineering tools</h1>
      <p>v2 tools are migrated without dropping working legacy features. Incomplete migrations keep a full legacy fallback.</p></div>
    </header>
    <section class="tool-index-grid">
      ${tools.map(tool=>`
        <article class="tool-index-card tool-index-card-actions">
          <span class="file-icon">${tool.short}</span>
          <span>
            <strong>${tool.title}</strong>
            <small>${tool.summary}</small>
            <small class="tool-parity ${tool.parity||"review"}">${parityLabel(tool)}</small>
          </span>
          <div class="tool-card-actions">
            ${tool.route?`<button class="tool-action primary" data-tool-route="${tool.route}">Open v2</button>`:""}
            ${tool.legacyUrl?`<button class="tool-action" data-tool-legacy="${tool.legacyUrl}">${tool.route?"Full legacy":"Open legacy"}</button>`:""}
          </div>
        </article>`).join("")}
    </section>
  </main>`;
}
