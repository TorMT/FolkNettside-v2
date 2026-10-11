import {accessState,getSession} from "../platform/session.js?v=8e80d2f316da68e351e1bf838a61f2f4d962c804";
import {DIVERSE_MODULES} from "./diverse-registry.js?v=8e80d2f316da68e351e1bf838a61f2f4d962c804";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

function statusLabel(status){
  if(status==="native")return "Native v2";
  if(status==="superseded")return "Moved into v2";
  if(status==="migration")return "Migrating";
  if(status==="preserved")return "Preserved demo";
  if(status==="repair")return "Repair needed";
  return "Review";
}

export function diversePageHTML(){
  const session=getSession();
  return `<main class="diverse-page">
    <header class="diverse-hero">
      <div>
        <span class="project-kicker">Shared v2 modules</span>
        <h1>Diverse</h1>
        <p>Utilities and side projects now share the FolkNettside shell, global theme and one central access/session boundary instead of maintaining separate app frameworks.</p>
      </div>
      <div class="diverse-session-card">
        <span>Session</span>
        <strong>${session.authenticated?"Signed in":"Guest / local-first"}</strong>
        <small>Authentication is central and optional unless a module explicitly requires it.</small>
      </div>
    </header>
    <section class="diverse-grid">
      ${DIVERSE_MODULES.map(module=>{
        const access=accessState(module.access,session);
        return `<article class="diverse-card" data-diverse-module="${module.id}">
          <div class="diverse-card-head"><span class="file-icon">${esc(module.short)}</span><div><strong>${esc(module.title)}</strong><small>${esc(module.category)}</small></div></div>
          <p>${esc(module.summary)}</p>
          <div class="diverse-card-meta">
            <span class="diverse-status ${module.status}">${statusLabel(module.status)}</span>
            <span class="diverse-access">${esc(access.label)}</span>
          </div>
          <div class="diverse-card-actions">
            ${module.route?`<button class="btn primary" data-go="${module.route}">Open v2</button>`:""}
            ${module.externalUrl?`<a class="btn primary" href="${esc(module.externalUrl)}" target="_blank" rel="noopener noreferrer">Open demo ↗</a>`:""}
            ${module.legacyUrl?`<a class="btn" href="${esc(module.legacyUrl)}" target="_blank" rel="noopener noreferrer">${module.status==="repair"?"Inspect legacy files":"Legacy reference"}</a>`:""}
          </div>
        </article>`;
      }).join("")}
    </section>
    <section class="diverse-architecture-note">
      <strong>Migration rule</strong>
      <p>Modules inherit the global CSS theme and Settings state. Local data remains usable without login; future cloud sync or private data uses the same central session service rather than module-specific authentication.</p>
    </section>
  </main>`;
}
