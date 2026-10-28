import {viewerKind} from "../viewers/registry.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";
import {isApprovedPublicCode} from "../viewers/ntnu-public-code.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";

function escapeHTML(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function buildTree(resources){
  const root={folders:new Map(),files:[]};
  for(const item of resources){
    let node=root;
    for(const [i,folder] of (Array.isArray(item.folders)?item.folders:[]).entries()){
      if(!node.folders.has(folder))node.folders.set(folder,{folders:new Map(),files:[],originalNames:new Set()});
      node=node.folders.get(folder);
      node.originalNames.add(item.originalFolders?.[i]||folder);
    }
    node.files.push(item);
  }
  return root;
}

function renderNode(node,indexOfResource,depth=0,routeForResource=null){
  const folderHTML=[...node.folders.entries()]
    .sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}))
    .map(([name,child])=>`<details class="resource-folder" ${depth<1?"open":""}>
      <summary><span class="folder-icon">▸</span><strong>${escapeHTML(name)}</strong>${child.originalNames&&[...child.originalNames].some(original=>original!==name)?`<span class="muted">NTNU: ${escapeHTML([...child.originalNames].join(", "))}</span>`:""}<span class="muted">${countFiles(child)} file(s)</span></summary>
      <div class="resource-folder-body">${renderNode(child,indexOfResource,depth+1,routeForResource)}</div>
    </details>`).join("");

  const fileHTML=node.files
    .slice()
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),undefined,{numeric:true,sensitivity:"base"}))
    .map(item=>{
      const index=indexOfResource(item);
      const href=routeForResource?.(index,item);
      if(href&&/^#\/viewer\/\d+\/[^#?]+\/\d+$/.test(href)){
        // Two independent real links: V2 preview and original NTNU resource.
        // Never nest anchors or rely on JavaScript-only click handlers.
        let original="";
        try{
          const url=new URL(item.url||item.path, "https://tormt.folk.ntnu.no");
          if(item.source==="ntnu"&&url.origin==="https://tormt.folk.ntnu.no"&&
             /^\/semestre\/\d+\//.test(url.pathname)&&!url.search&&!url.hash)
            original=`<a class="resource-original-link" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer" aria-label="Åpne originalfilen ${escapeHTML(item.name)} på NTNU">NTNU ↗</a>`;
        }catch{}
        // Cross-origin file bytes cannot be read by GitHub Pages without
        // NTNUs CORS permission. Opening the public original remains useful
        // regardless of preview access, and must not be JavaScript-dependent.
        // KISSsoft files have a native V2 adapter. The primary action must
        // open that adapter, with NTNU retained as the original/download link.
        const directFirst=item.remoteArchive===true&&Boolean(original)&&
          viewerKind(item)!=="kisssoft"&&!isApprovedPublicCode(item)&&
          !["PDF","IMAGE","VIDEO","AUDIO"].includes(String(item.kind||"").toUpperCase());
        if(directFirst){
          const originalURL=new URL(item.url);
          return `<div class="resource-row resource-row-links resource-row-direct-first">
            <a class="resource-source-primary" href="${escapeHTML(originalURL.href)}" target="_blank" rel="noopener noreferrer"
               aria-label="Åpne ${escapeHTML(item.label||item.name)} på NTNU">
              <span class="file-icon">${escapeHTML(item.kind)}</span>
              <span><strong>${escapeHTML(item.label||item.name)}</strong><span class="muted resource-original-name">${escapeHTML(item.name)}</span></span>
              <span class="muted">Åpne ↗</span>
            </a>
            <a class="resource-viewer-link resource-preview-alternate" data-resource="${index}" href="${escapeHTML(href)}"
               aria-label="Prøv V2-viser for ${escapeHTML(item.label||item.name)}">V2-viser ›</a>
          </div>`;
        }
        return `<div class="resource-row resource-row-links">
          <a class="resource-viewer-link" data-resource="${index}" href="${escapeHTML(href)}" aria-label="Vis ${escapeHTML(item.label||item.name)} i V2">
            <span class="file-icon">${escapeHTML(item.kind)}</span>
            <span><strong>${escapeHTML(item.label||item.name)}</strong><span class="muted resource-original-name">${escapeHTML(item.name)}</span></span>
            <span class="muted">Vis ›</span>
          </a>
          ${original}
        </div>`;
      }
      return `<div class="resource-row" role="button" tabindex="0" aria-label="Open ${escapeHTML(item.label||item.name)}" data-resource="${index}">
        <span class="file-icon">${escapeHTML(item.kind)}</span>
        <div><strong>${escapeHTML(item.label)}</strong><div class="muted">${escapeHTML(item.name)}</div></div>
        <span class="muted">Open ›</span>
      </div>`;
    }).join("");

  return folderHTML+fileHTML;
}

function countFiles(node){
  let total=node.files.length;
  for(const child of node.folders.values())total+=countFiles(child);
  return total;
}

export function renderResourceTree(resources,indexOfResource,{routeForResource=null}={}){
  return renderNode(buildTree(resources),indexOfResource,0,routeForResource);
}
