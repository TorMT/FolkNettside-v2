import {loadAdapter} from "./registry.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf";
import {escapeHTML} from "./utils.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf";

export async function mountViewer(root,resource,onBack){
  root.__viewerCleanup?.();
  root.__viewerCleanup=null;

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
      <button data-action="find" hidden>Find</button>
      <div class="viewer-find" hidden>
        <input type="search" placeholder="Find in file" aria-label="Find in file">
        <span class="viewer-find-count"></span>
      </div>
      <button data-action="fit" hidden>Fit</button>
      <button data-action="resetZoom" hidden>Reset view</button>
      <button data-action="resetProgress" hidden>Reset progress</button>
      <span class="top-spacer"></span>
      <button id="viewer-full">Fullscreen</button>
    </div>
    <div class="viewer-main">
      <section class="viewer-canvas" id="viewer-canvas"><div class="viewer-loading">Loading…</div></section>
      <aside class="viewer-panel">
        <div class="panel-tabs"><button class="active" data-viewer-panel="file">File</button><button data-viewer-panel="info">Info</button></div>
        <div data-viewer-panel-content="file">
          <strong>${escapeHTML(resource.name)}</strong>
          <p class="muted">${escapeHTML(resource.kind)} · ${escapeHTML(resource.source||"site")}</p>
          ${Array.isArray(resource.folders)&&resource.folders.length?`<p class="viewer-path">${resource.folders.map(escapeHTML).join(" / ")}</p>`:""}
          <p class="muted">Viewer controls are enabled only when supported by this file type.</p>
        </div>
        <div data-viewer-panel-content="info" hidden>
          <div class="viewer-info-list">
            <div><span>Course</span><strong>${escapeHTML(resource.courseCode||"—")}</strong></div>
            <div><span>Semester</span><strong>${escapeHTML(resource.semester||"—")}</strong></div>
            <div><span>Section</span><strong>${escapeHTML(resource.section||"—")}</strong></div>
            <div><span>Type</span><strong>${escapeHTML(resource.kind||"FILE")}</strong></div>
            <div><span>Source</span><strong>${escapeHTML(resource.source||"site")}</strong></div>
          </div>
          <div class="viewer-info-path"><span>Path</span><code>${escapeHTML(resource.relativePath||resource.path||resource.url||"—")}</code></div>
          <button class="btn" id="viewer-copy-path">Copy path</button>
        </div>
      </aside>
    </div>
    <footer class="viewer-status">
      <span id="viewer-info">Loading…</span>
      <span>${escapeHTML(resource.url||resource.path)}</span>
    </footer>
  </main>`;

  const canvas=root.querySelector("#viewer-canvas");
  const status=root.querySelector("#viewer-info");
  const toolbar=root.querySelector(".viewer-toolbar");
  const findButton=toolbar.querySelector('[data-action="find"]');
  const findWrap=toolbar.querySelector(".viewer-find");
  const findInput=findWrap.querySelector("input");
  const findCount=findWrap.querySelector(".viewer-find-count");
  const fitButton=toolbar.querySelector('[data-action="fit"]');
  const resetButton=toolbar.querySelector('[data-action="resetZoom"]');
  const resetProgressButton=toolbar.querySelector('[data-action="resetProgress"]');

  const panelButtons=[...root.querySelectorAll("[data-viewer-panel]")];
  const panelContents=[...root.querySelectorAll("[data-viewer-panel-content]")];
  panelButtons.forEach(button=>button.addEventListener("click",()=>{
    const id=button.dataset.viewerPanel;
    panelButtons.forEach(item=>item.classList.toggle("active",item===button));
    panelContents.forEach(content=>content.hidden=content.dataset.viewerPanelContent!==id);
  }));
  root.querySelector("#viewer-copy-path")?.addEventListener("click",async event=>{
    const value=resource.relativePath||resource.path||resource.url||"";
    try{
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent="Copied";
      setTimeout(()=>{if(event.currentTarget?.isConnected)event.currentTarget.textContent="Copy path"},1200);
    }catch{
      event.currentTarget.textContent="Copy unavailable";
    }
  });

  root.querySelector("#viewer-back").onclick=()=>{
    root.__viewerCleanup?.();
    root.__viewerCleanup=null;
    onBack();
  };
  root.querySelector("#open-original").onclick=()=>window.open(resource.url||resource.path,"_blank","noopener");
  root.querySelector("#viewer-full").onclick=()=>canvas.requestFullscreen?.();

  try{
    const adapter=await loadAdapter(resource);
    const result=await adapter.render(canvas,resource);
    const adapterCleanup=result?.cleanup || null;
    root.__viewerCleanup=adapterCleanup;
    status.textContent=result?.info || "."+adapter.extension;

    const actions=result?.actions||{};

    if(typeof actions.find==="function"){
      findButton.hidden=false;
      findButton.onclick=()=>{
        findWrap.hidden=!findWrap.hidden;
        if(!findWrap.hidden){
          findInput.focus();
          findInput.select();
        }
      };
      const runFind=()=>{
        const match=actions.find(findInput.value);
        if(match&&typeof match.total==="number"){
          findCount.textContent=match.total?(String(match.index)+"/"+String(match.total)):"0";
        }
      };
      findInput.addEventListener("keydown",event=>{
        if(event.key==="Enter"){
          event.preventDefault();
          runFind();
        }else if(event.key==="Escape"){
          findWrap.hidden=true;
        }
      });
      const shortcut=event=>{
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="f"){
          event.preventDefault();
          findWrap.hidden=false;
          findInput.focus();
          findInput.select();
        }
      };
      window.addEventListener("keydown",shortcut);
      const previousCleanup=root.__viewerCleanup;
      root.__viewerCleanup=()=>{
        window.removeEventListener("keydown",shortcut);
        previousCleanup?.();
      };
    }

    if(typeof actions.fit==="function"){
      fitButton.hidden=false;
      fitButton.onclick=()=>actions.fit();
    }
    if(typeof actions.resetZoom==="function"){
      resetButton.hidden=false;
      resetButton.onclick=()=>actions.resetZoom();
    }
    if(typeof actions.resetProgress==="function"){
      resetProgressButton.hidden=false;
      resetProgressButton.onclick=()=>actions.resetProgress();
    }
  }catch(error){
    const message=escapeHTML(error?.message||error);
    canvas.innerHTML=`<div class="viewer-error">
      <span class="project-kicker">Viewer error</span>
      <h2>Could not render this resource</h2>
      <p>${message}</p>
      <div class="viewer-error-actions">
        <button class="btn primary" id="viewer-retry">Retry</button>
        <button class="btn" id="viewer-error-original">Open original</button>
      </div>
    </div>`;
    status.textContent="Error";
    canvas.querySelector("#viewer-retry")?.addEventListener("click",()=>mountViewer(root,resource,onBack));
    canvas.querySelector("#viewer-error-original")?.addEventListener("click",()=>window.open(resource.url||resource.path,"_blank","noopener"));
  }
}
