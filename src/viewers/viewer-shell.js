import {loadAdapter} from "./registry.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f";
import {escapeHTML} from "./utils.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f";

export async function mountViewer(root,resource,onBack){
  root.innerHTML=`<main class="viewer">
    <header class="viewer-head">
      <div>
        <div class="muted">Courses / Semester ${escapeHTML(resource.semester)} / ${escapeHTML(resource.courseCode)} / ${escapeHTML(resource.section)}</div>
        <strong>${escapeHTML(resource.label)}</strong>
      </div>
      <div>
        <button class="btn" id="open-original">Open original</button>
        <button class="btn" id="viewer-back">Back</button>
      </div>
    </header>
    <div class="viewer-toolbar">
      <button data-action="find">Find</button>
      <button data-action="fit">Fit</button>
      <button data-action="resetZoom">100%</button>
      <span class="top-spacer"></span>
      <button id="viewer-full">Fullscreen</button>
    </div>
    <div class="viewer-main">
      <section class="viewer-canvas" id="viewer-canvas"><div class="viewer-loading">Loading…</div></section>
      <aside class="viewer-panel">
        <div class="panel-tabs"><button class="active">Files</button><button>Info</button></div>
        <strong>${escapeHTML(resource.name)}</strong>
        <p class="muted">${escapeHTML(resource.kind)} fixture</p>
        <p class="muted">The adapter is loaded only when this file type is opened.</p>
      </aside>
    </div>
    <footer class="viewer-status">
      <span id="viewer-info">Loading…</span>
      <span>${escapeHTML(resource.path)}</span>
    </footer>
  </main>`;

  root.querySelector("#viewer-back").onclick=()=>{root.__viewerCleanup?.();onBack();};
  root.querySelector("#open-original").onclick=()=>window.open(resource.path,"_blank","noopener");
  root.querySelector("#viewer-full").onclick=()=>root.querySelector(".viewer-canvas").requestFullscreen?.();

  const canvas=root.querySelector("#viewer-canvas");
  const status=root.querySelector("#viewer-info");

  try{
    const adapter=await loadAdapter(resource);
    const result=await adapter.render(canvas,resource);
    root.__viewerCleanup=result?.cleanup || null;
    status.textContent=result?.info || `.${adapter.extension}`;
  }catch(error){
    canvas.innerHTML=`<pre class="code-view">Viewer error: ${escapeHTML(error?.message || error)}</pre>`;
    status.textContent="Error";
  }
}
