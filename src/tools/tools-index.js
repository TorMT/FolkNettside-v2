export function toolsIndexHTML(){
  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools</div>
    <header class="tool-header">
      <div><span class="project-kicker">Shared tools</span><h1>Engineering tools</h1>
      <p>Small calculators and viewers that are reusable across courses and engineering work.</p></div>
    </header>
    <section class="tool-index-grid">
      <button class="tool-index-card" data-tool-route="/tools/fluid">
        <span class="file-icon">FL</span>
        <span><strong>Fluid properties</strong><small>Legacy polynomial estimates with derived ν, α and Pr</small></span>
        <span>Open ›</span>
      </button>
      <div class="tool-index-card disabled">
        <span class="file-icon">CP</span>
        <span><strong>CoolProp</strong><small>Reference-grade thermophysical properties · next</small></span>
        <span>Planned</span>
      </div>
      <div class="tool-index-card disabled">
        <span class="file-icon">PT</span>
        <span><strong>Periodic table</strong><small>Data-driven chemistry tool · planned</small></span>
        <span>Planned</span>
      </div>
    </section>
  </main>`;
}
