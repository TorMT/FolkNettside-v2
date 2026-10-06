import {TOOL_REGISTRY} from "./tool-registry.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd";

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
          <span><strong>${tool.title}</strong><small>${tool.summary}</small><small class="tool-parity ${tool.parity||"review"}">Parity: ${tool.parity||"review"}</small></span>
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
