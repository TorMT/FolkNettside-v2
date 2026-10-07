import {getKekule} from "../vendor/kekule-runtime.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419";
import {CHEM_IMPORT_EXTENSIONS,chemActionForEvent} from "./chem-editor-core.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419";

function downloadText(filename,text){
  const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function chemEditorHTML(){
  return '<main class="tool-page chem-tool">'+
    '<div class="crumbs">Courses / Tools / Chemical structure editor</div>'+
    '<header class="tool-header"><div><span class="project-kicker">Chemistry tool</span><h1>Chemical structure editor</h1><p>Kekule-based molecule editor with legacy import/export and editing actions, loaded only when opened.</p><div class="tool-parity-banner"><strong>Parity review:</strong> the working legacy actions are migrated. Full legacy remains available until side-by-side verification is complete.</div></div><div id="chem-status" class="coolprop-engine-status">Editor not loaded</div></header>'+
    '<section class="chem-toolbar">'+
      '<button class="btn" data-chem-action="new">New</button>'+
      '<button class="btn" data-chem-action="import">Import</button>'+
      '<button class="btn" data-chem-action="exportMol">MOL</button>'+
      '<button class="btn primary" data-chem-action="exportSmiles">SMILES</button>'+
      '<button class="btn" data-chem-action="undo">Undo</button>'+
      '<button class="btn" data-chem-action="redo">Redo</button>'+
      '<button class="btn" data-chem-action="clean">Clean 2D</button>'+
      '<button class="btn" data-chem-action="copySmiles">Copy SMILES</button>'+
      '<button class="btn" data-chem-action="tips">Tips</button>'+
    '</section>'+
    '<section class="chem-editor-card">'+
      '<div class="chem-editor-note"><strong>Drawing tools</strong><span>Use the editor toolbar inside the canvas.</span></div>'+
      '<div id="chem-composer" class="chem-composer"><div class="viewer-loading">Load editor to begin…</div></div>'+
      '<footer id="chem-message" class="chem-message muted">Kekule loads from CDN on demand, matching the legacy implementation.</footer>'+
    '</section>'+
    '<dialog id="chem-tips" class="chem-tips"><form method="dialog"><h3>Shortcuts</h3><p>Ctrl/Cmd+Z undo · Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo · Ctrl/Cmd+L Clean 2D · Ctrl/Cmd+M MOL · Ctrl/Cmd+E SMILES · Ctrl/Cmd+K copy SMILES · Ctrl/Cmd+N new · Ctrl/Cmd+I import.</p><p>If the editor does not load, a network/CSP/ad-blocker may be blocking unpkg.com.</p><button class="btn primary">Close</button></form></dialog>'+
  '</main>';
}

export async function bindChemEditor(root){
  const host=root.querySelector("#chem-composer");
  const status=root.querySelector("#chem-status");
  const message=root.querySelector("#chem-message");
  const tips=root.querySelector("#chem-tips");
  const fileInput=document.createElement("input");
  fileInput.type="file";
  fileInput.accept=CHEM_IMPORT_EXTENSIONS.map(ext=>"."+ext).join(",");
  fileInput.hidden=true;
  root.append(fileInput);

  let composer=null;
  let disposed=false;

  function setStatus(left,right=""){
    if(status)status.textContent=left;
    if(message)message.textContent=right||left;
  }

  async function ensureComposer(){
    if(composer)return composer;
    setStatus("Loading editor…","Loading Kekule from CDN…");
    const Kekule=await getKekule();
    if(disposed)throw new Error("Editor was disposed during load");
    host.replaceChildren();
    composer=new Kekule.Editor.Composer(host);
    composer.setEnableOperHistory(true);
    composer.setChemObj(new Kekule.StructureFragment());
    try{composer.setSize?.("100%","100%")}catch{}
    setStatus("Ready","Kekule editor ready");
    return composer;
  }

  async function save(format,filename){
    const active=await ensureComposer();
    const Kekule=globalThis.Kekule;
    const text=Kekule.IO.saveFormatData(active.getChemObj(),format);
    downloadText(filename,text);
    setStatus("Exported "+filename,String(text.length)+" chars");
    return text;
  }

  async function copySmiles(){
    const active=await ensureComposer();
    const text=globalThis.Kekule.IO.saveFormatData(active.getChemObj(),"smi");
    await navigator.clipboard.writeText(text);
    setStatus("Copied SMILES",text.slice(0,120));
    return text;
  }

  async function action(name){
    try{
      if(name==="tips"){tips?.showModal?.();return}
      if(name==="import"){await ensureComposer();fileInput.click();return}
      const active=await ensureComposer();
      if(name==="new"){active.setChemObj(new globalThis.Kekule.StructureFragment());setStatus("New document");return}
      if(name==="undo"){active.undo();setStatus("Undo");return}
      if(name==="redo"){active.redo();setStatus("Redo");return}
      if(name==="clean"){active.execCommand?.("clean");setStatus("Clean 2D applied");return}
      if(name==="exportMol"){await save("mol","structure.mol");return}
      if(name==="exportSmiles"){await save("smi","structure.smi");return}
      if(name==="copySmiles"){await copySmiles();return}
    }catch(error){
      setStatus("Editor error",String(error?.message||error));
    }
  }

  const clickHandlers=[];
  root.querySelectorAll("[data-chem-action]").forEach(button=>{
    const handler=()=>action(button.dataset.chemAction);
    button.addEventListener("click",handler);
    clickHandlers.push([button,handler]);
  });

  fileInput.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    try{
      const active=await ensureComposer();
      const text=await file.text();
      const obj=globalThis.Kekule.IO.loadFormatData(text,null);
      if(!obj)throw new Error("Format not recognized");
      active.setChemObj(obj);
      setStatus("Imported "+file.name);
    }catch(error){
      setStatus("Import failed",String(error?.message||error));
    }finally{
      fileInput.value="";
    }
  });

  const keyHandler=event=>{
    const target=event.target;
    if(target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable))return;
    const name=chemActionForEvent(event);
    if(!name)return;
    event.preventDefault();
    event.stopPropagation();
    action(name);
  };
  document.addEventListener("keydown",keyHandler,true);

  const resize=()=>{
    try{composer?.resize?.();composer?.updateSize?.();composer?.refresh?.()}catch{}
  };
  window.addEventListener("resize",resize);

  ensureComposer().catch(error=>setStatus("Could not load editor",String(error?.message||error)));

  return {
    cleanup(){
      disposed=true;
      document.removeEventListener("keydown",keyHandler,true);
      window.removeEventListener("resize",resize);
      clickHandlers.forEach(([button,handler])=>button.removeEventListener("click",handler));
      try{composer?.finalize?.()}catch{}
      fileInput.remove();
    }
  };
}