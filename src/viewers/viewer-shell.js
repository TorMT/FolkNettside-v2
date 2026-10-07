import {loadAdapter} from "./registry.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b";
import {escapeHTML} from "./utils.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b";

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
      <span class="top-spacer"></span>
      <button id="viewer-full">Fullscreen</button>
    </div>
    <div class="viewer-main">
      <section class="viewer-canvas" id="viewer-canvas"><div class="viewer-loading">Loading…</div></section>
      <aside class="viewer-panel">
        <div class="panel-tabs"><button class="active">Files</button><button>Info</button></div>
        <strong>${escapeHTML(resource.name)}</strong>
        <p class="muted">${escapeHTML(resource.kind)} · ${escapeHTML(resource.source||"site")}</p>
        <p class="muted">Viewer controls are enabled only when supported by this file type.</p>
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
    root.__viewerCleanup=result?.cleanup || null;
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
    }

    if(typeof actions.fit==="function"){
      fitButton.hidden=false;
      fitButton.onclick=()=>actions.fit();
    }
    if(typeof actions.resetZoom==="function"){
      resetButton.hidden=false;
      resetButton.onclick=()=>actions.resetZoom();
    }
  }catch(error){
    canvas.innerHTML=`<pre class="code-view">Viewer error: ${escapeHTML(error?.message || error)}</pre>`;
    status.textContent="Error";
  }
}
