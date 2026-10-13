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

function renderNode(node,indexOfResource,depth=0){
  const folderHTML=[...node.folders.entries()]
    .sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}))
    .map(([name,child])=>`<details class="resource-folder" ${depth<1?"open":""}>
      <summary><span class="folder-icon">▸</span><strong>${escapeHTML(name)}</strong>${child.originalNames&&[...child.originalNames].some(original=>original!==name)?`<span class="muted">NTNU: ${escapeHTML([...child.originalNames].join(", "))}</span>`:""}<span class="muted">${countFiles(child)} file(s)</span></summary>
      <div class="resource-folder-body">${renderNode(child,indexOfResource,depth+1)}</div>
    </details>`).join("");

  const fileHTML=node.files
    .slice()
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),undefined,{numeric:true,sensitivity:"base"}))
    .map(item=>`<div class="resource-row" role="button" tabindex="0" aria-label="Open ${escapeHTML(item.label||item.name)}" data-resource="${indexOfResource(item)}">
      <span class="file-icon">${escapeHTML(item.kind)}</span>
      <div><strong>${escapeHTML(item.label)}</strong><div class="muted">${escapeHTML(item.name)}</div></div>
      <span class="muted">Open ›</span>
    </div>`).join("");

  return folderHTML+fileHTML;
}

function countFiles(node){
  let total=node.files.length;
  for(const child of node.folders.values())total+=countFiles(child);
  return total;
}

export function renderResourceTree(resources,indexOfResource){
  return renderNode(buildTree(resources),indexOfResource);
}
