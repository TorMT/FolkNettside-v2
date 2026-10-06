import {TOOL_REGISTRY} from "./tool-registry.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8";

export function toolsIndexHTML(){
  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools</div>
    <header class="tool-header">
      <div><span class="project-kicker">Shared tools</span><h1>Engineering tools</h1>
      <p>Small calculators and viewers that are reusable across courses and engineering work.</p></div>
    </header>
    <section class="tool-index-grid">
      ${TOOL_REGISTRY.map(tool=>tool.route?`
        <button class="tool-index-card" data-tool-route="${tool.route}">
          <span class="file-icon">${tool.short}</span>
          <span><strong>${tool.title}</strong><small>${tool.summary}</small></span>
          <span>Open ›</span>
        </button>`:`
        <div class="tool-index-card disabled">
          <span class="file-icon">${tool.short}</span>
          <span><strong>${tool.title}</strong><small>${tool.summary}</small></span>
          <span>${tool.status}</span>
        </div>`).join("")}
    </section>
  </main>`;
}
