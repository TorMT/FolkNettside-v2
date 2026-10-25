import {loadAdapter,viewerKind} from "./registry.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
import {escapeHTML} from "./utils.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
import {viewerBreadcrumbHTML} from "./viewer-breadcrumb.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
import {remoteReadOnlyFallbackURL} from "./remote-readonly-fallback.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
import {canRetryNTNUWithLocalFile,createNTNULocalPreview} from "./local-ntnu-preview.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";

export async function mountViewer(root,resource,onBack){
  // A previous asynchronous adapter may finish after navigation. Only the
  // newest mount may claim the shared root, status, toolbar or cleanup hook.
  const ticket=(root.__viewerTicket||0)+1;
  root.__viewerTicket=ticket;
  root.__viewerCleanup?.();
  root.__viewerCleanup=null;
  // Blob URLs are session-only and must be revoked whenever the viewer closes.
  if(resource.localPreview===true&&String(resource.path||"").startsWith("blob:")){
    root.__viewerCleanup=()=>URL.revokeObjectURL(resource.path);
  }

  const isQuiz=viewerKind(resource)==="quiz";
  root.innerHTML=`<main class="viewer ${isQuiz?"viewer--quiz":""}">
    <header class="viewer-head">
      <div>
        ${viewerBreadcrumbHTML(resource)}
        <strong>${escapeHTML(resource.label)}</strong>
      </div>
      <div class="viewer-head-actions">
        ${resource.fileNavigation?.total>1?`<nav class="viewer-siblings" aria-label="Naviger mellom filer i seksjonen">
          ${resource.fileNavigation.previous?`<a class="btn" href="${escapeHTML(resource.fileNavigation.previous.href)}" aria-label="Forrige fil: ${escapeHTML(resource.fileNavigation.previous.label)}">← Forrige fil</a>`:'<span class="viewer-sibling-placeholder" aria-hidden="true"></span>'}
          <span class="viewer-sibling-count">${Number(resource.fileNavigation.position)} av ${Number(resource.fileNavigation.total)}</span>
          ${resource.fileNavigation.next?`<a class="btn" href="${escapeHTML(resource.fileNavigation.next.href)}" aria-label="Neste fil: ${escapeHTML(resource.fileNavigation.next.label)}">Neste fil →</a>`:'<span class="viewer-sibling-placeholder" aria-hidden="true"></span>'}
        </nav>`:""}
        <div class="viewer-file-actions">
          ${isQuiz?'<button class="btn" id="viewer-quiz-info" aria-pressed="false">File info</button>':""}
          ${canRetryNTNUWithLocalFile(resource)?`<button class="btn" type="button" id="viewer-choose-local" aria-controls="viewer-local-file">Åpne nedlastet fil</button>
            <input id="viewer-local-file" type="file" aria-label="Velg nedlastet lokal kopi av filen" accept=".${escapeHTML(String(resource.name).split(".").at(-1).toLowerCase())}" hidden>
            <span class="viewer-local-status" id="viewer-local-status" role="status" aria-live="polite"></span>`:""}
          <button class="btn" id="open-original">Open original</button>
          <button class="btn" id="viewer-back">Back</button>
        </div>
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
  const active=()=>root.__viewerTicket===ticket&&canvas?.isConnected&&root.contains(canvas);
  const status=root.querySelector("#viewer-info");
  canvas.addEventListener("viewer-info-update",event=>{if(event.detail)status.textContent=String(event.detail)});
  const toolbar=root.querySelector(".viewer-toolbar");
  const findButton=toolbar.querySelector('[data-action="find"]');
  const findWrap=toolbar.querySelector(".viewer-find");
  const findInput=findWrap.querySelector("input");
  const findCount=findWrap.querySelector(".viewer-find-count");
  const fitButton=toolbar.querySelector('[data-action="fit"]');
  const resetButton=toolbar.querySelector('[data-action="resetZoom"]');
  const resetProgressButton=toolbar.querySelector('[data-action="resetProgress"]');
  const bindLocalChoice=()=>{
    const button=root.querySelector("#viewer-choose-local");
    const input=root.querySelector("#viewer-local-file");
    const feedback=root.querySelector("#viewer-local-status");
    if(!button||!input)return;
    button.addEventListener("click",()=>input.click());
    input.addEventListener("change",()=>{
      const file=input.files?.[0];
      if(!file||!active())return;
      try{
        const local=createNTNULocalPreview(resource,file);
        // The selected data never leaves this browser tab. Open original still
        // uses the unchanged NTNU resource.url.
        void mountViewer(root,local,onBack);
      }catch(error){
        if(feedback)feedback.textContent=String(error.message||error);
      }
      input.value="";
    });
  };

  // PDFs and images may fail silently without throwing; keep local
  // downloaded-file opening available before an adapter finishes.
  bindLocalChoice();
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

  root.querySelector("#viewer-quiz-info")?.addEventListener("click",event=>{
    const toggled=root.querySelector(".viewer")?.classList.toggle("viewer--quiz-info");
    event.currentTarget.setAttribute("aria-pressed",String(Boolean(toggled)));
    event.currentTarget.textContent=toggled?"Hide file info":"File info";
  });

  root.querySelector("#viewer-back").onclick=()=>{
    root.__viewerTicket++;
    root.__viewerCleanup?.();
    root.__viewerCleanup=null;
    onBack();
  };
  root.querySelector("#open-original").onclick=()=>window.open(resource.url||resource.path,"_blank","noopener");
  root.querySelector("#viewer-full").onclick=()=>canvas.requestFullscreen?.();

  try{
    const adapter=await loadAdapter(resource);
    if(!active())return;
    const result=await adapter.render(canvas,resource);
    const adapterCleanup=result?.cleanup || null;
    if(!active()){adapterCleanup?.();return}
    const blobCleanup=root.__viewerCleanup;
    root.__viewerCleanup=()=>{adapterCleanup?.();blobCleanup?.()};
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
    if(!active())return;
    const publicOriginal=remoteReadOnlyFallbackURL(resource,viewerKind(resource));
    if(publicOriginal){
      canvas.innerHTML=`<div class="viewer-readonly-fallback">
        <strong>Viser originalfilen fra NTNU (skrivebeskyttet)</strong>
        <p>Den interaktive forhåndsvisningen er utilgjengelig fra GitHub Pages. Under vises NTNUs egen råfil-visning dersom nettleseren tillater det. Dette krever ikke CORS.</p>
        <p>Du kan åpne en nedlastet kopi via knappen «Åpne nedlastet fil» i toppmenyen.</p>
        <div class="viewer-error-actions">
          <button class="btn" id="viewer-retry">Prøv interaktiv viser på nytt</button>
                    <a class="btn primary" href="${escapeHTML(publicOriginal)}" target="_blank" rel="noopener noreferrer">Åpne originalfil på NTNU ↗</a>
        </div>
        <p class="muted">Hvis feltet nedenfor er tomt eller filen lastes ned, bruk lenken til originalfilen. Skript kan ikke kjøres i den innebygde visningen.</p>
      </div>
      <iframe class="viewer-remote-raw-frame" title="Skrivebeskyttet original fra NTNU" sandbox="" referrerpolicy="no-referrer" src="${escapeHTML(publicOriginal)}"></iframe>`;
      status.textContent="Originalfil fra NTNU · sikker reservevisning";
      canvas.querySelector("#viewer-retry")?.addEventListener("click",()=>mountViewer(root,resource,onBack));
      return;
    }
    const remote=resource.remoteArchive===true&&typeof resource.url==="string"&&
      resource.url.startsWith("https://tormt.folk.ntnu.no/semestre/");
    const message=remote
      ?"Forhåndsvisning på GitHub Pages kan være blokkert av NTNUs CORS-regler. Originalfilen kan åpnes direkte på NTNU."
      :escapeHTML(error?.message||error);
    canvas.innerHTML=`<div class="viewer-error">
      <span class="project-kicker">Viewer error</span>
      <h2>Could not render this resource</h2>
      <p>${message}</p>
      ${canRetryNTNUWithLocalFile(resource)?'<p>Du kan åpne en nedlastet kopi via «Åpne nedlastet fil» i toppmenyen.</p>':""}
      <div class="viewer-error-actions">
        <button class="btn primary" id="viewer-retry">Retry</button>
                <a class="btn" id="viewer-error-original" target="_blank" rel="noopener noreferrer" href="${escapeHTML(resource.url||resource.path||"#")}">Åpne original på NTNU ↗</a>
      </div>
    </div>`;
    status.textContent="Error";
    canvas.querySelector("#viewer-retry")?.addEventListener("click",()=>mountViewer(root,resource,onBack));

  }
}
