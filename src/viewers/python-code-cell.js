import {escapeHTML} from "./utils.js?v=5053d96772d88262e4d5bd2390f554a05635c376";
import {renderPythonLines,pythonHighlightedLines,changeIndent,insertPythonNewline} from "./python-syntax.js?v=5053d96772d88262e4d5bd2390f554a05635c376";

export function mountPythonCodeCell(container,{
  source="",title="Python",onRun=async()=>{},onStop=()=>{},output="",maxEditorHeight=520
}={}){
  container.innerHTML='<div class="python-cell vscode-python-cell">'+
    '<div class="python-cell-toolbar">'+
      '<strong>'+escapeHTML(title)+'</strong>'+
      '<button type="button" data-py-run>Run</button>'+
      '<button type="button" data-py-stop>Stop</button>'+
      '<button type="button" data-py-edit aria-pressed="false">Edit</button>'+
      '<button type="button" data-py-wrap aria-pressed="false">Wrap</button>'+
      '<button type="button" data-py-lines aria-pressed="true">Lines</button>'+
      '<button type="button" data-py-copy>Copy</button>'+
      '<span class="python-cell-status" role="status">Ready</span>'+
    '</div>'+
    '<div class="python-code-stats" aria-live="off"></div>'+
    '<div class="python-cell-body">'+
      '<pre class="python-code-preview" tabindex="0" aria-label="Syntax-highlighted Python preview"><code></code></pre>'+
      '<div class="python-editor-stage" hidden>'+
        '<div class="python-edit-gutter" aria-hidden="true"></div>'+
        '<div class="python-editor-surface">'+
          '<pre class="python-code-edit-highlight" aria-hidden="true"><code></code></pre>'+
          '<textarea class="python-code-edit" aria-label="Editable Python source" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" wrap="off"></textarea>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<section class="python-cell-output" aria-label="Python output">'+
      '<div class="python-output-label">Output</div>'+
      '<pre class="python-output-text"></pre>'+
      '<div class="python-output-figures"></div>'+
      '<div class="python-output-files" aria-label="Generated Python files"></div>'+
    '</section>'+
  '</div>';
  const $=query=>container.querySelector(query);
  const editor=$(".python-code-edit"),preview=$(".python-code-preview");
  const code=preview.querySelector("code"),stage=$(".python-editor-stage");
  const overlay=$(".python-code-edit-highlight"),overlayCode=overlay.querySelector("code");
  const gutter=$(".python-edit-gutter"),status=$(".python-cell-status");
  const runButton=$("[data-py-run]"),stopButton=$("[data-py-stop]");
  const stats=$(".python-code-stats");
  editor.value=String(source);
  let wrap=false,lines=true,disposed=false,editing=false;
  const maxHeight=Math.max(180,Math.min(800,Number(maxEditorHeight)||520));
  const updateSize=()=>{
    const count=editor.value.split(/\r\n|\n|\r/).length;
    stage.style.height=Math.min(maxHeight,Math.max(180,count*20+32))+"px";
  };
  function renderPreview(){
    if(disposed)return;
    // For very large uploads, avoid creating hundreds of thousands of token
    // elements. Source remains editable/copyable; preview is escaped plaintext.
    if(editor.value.length>380000){
      code.textContent=editor.value;
      preview.classList.add("python-large-source");
      return;
    }
    preview.classList.remove("python-large-source");
    code.innerHTML=renderPythonLines(editor.value);
  }
  function syncScroll(){
    overlay.scrollTop=editor.scrollTop;
    overlay.scrollLeft=editor.scrollLeft;
    gutter.scrollTop=editor.scrollTop;
  }
  function renderEditor(){
    if(disposed)return;
    const lines=pythonHighlightedLines(editor.value);
    // Large notebooks are available without token expansion / freezes.
    if(editor.value.length>380000){
      overlayCode.textContent=editor.value;
    }else{
      overlayCode.innerHTML=lines.map(line=>'<span class="python-editor-line">'+line+'</span>').join("\n");
    }
    gutter.innerHTML=Array.from({length:Math.min(lines.length,10000)},(_,i)=>'<span>'+(i+1)+'</span>').join("");
    updateSize();
    syncScroll();
  }
  function updateStatistics(){
    const cursor=editor.selectionStart;
    const leading=editor.value.slice(0,cursor);
    const line=leading.split(/\r\n|\n|\r/).length;
    const col=leading.length-(Math.max(leading.lastIndexOf("\n"),leading.lastIndexOf("\r"))+1)+1;
    const count=editor.value.split(/\r\n|\n|\r/).length;
    stats.textContent="Ln "+line+", Col "+col+" · "+count+" lines · Python · UTF-8 · Spaces: 4";
  }
  function updateSource(){
    if(!editing)renderPreview();
    else renderEditor();
    updateStatistics();
  }
  function setSourceChange(result){
    editor.value=result.value;
    editor.setSelectionRange(result.start,result.end);
    updateSource();
  }
  function setRunning(running){
    runButton.disabled=running;
    stopButton.disabled=false;
    status.textContent=running?"Running…":"Ready";
  }
  function pushOutput(output){
    if(disposed||output?.type!=="image")return;
    const src=output.src;
    if(typeof src!=="string"||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src))return;
    const img=document.createElement("img");img.src=src;img.alt="Python plot from show()";
    $(".python-output-figures").append(img);
    $(".python-output-text").textContent="Figure displayed below";
  }
  function showOutput(result={}){
    const stdout=String(result.stdout||""),stderr=String(result.stderr||"");
    const tail=result.result==null?"":String(result.result);
    const raw=[stdout,tail,stderr].filter(Boolean).join("\n");
    $(".python-output-text").textContent=raw||"No text output";
    $(".python-output-text").classList.toggle("has-error",Boolean(stderr||result.error));
    $(".python-output-figures").replaceChildren();
    const fileHost=$(".python-output-files");
    for(const link of fileHost.querySelectorAll("a[data-python-download]")){
      if(link.dataset.blobUrl)URL.revokeObjectURL(link.dataset.blobUrl);
    }
    fileHost.replaceChildren();
    for(const file of result.files||[]){
      if(!file?.name||!file?.bytes)continue;
      const blob=new Blob([file.bytes]),url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;link.download=String(file.name).replace(/[\\/]+/g,"_");
      link.dataset.pythonDownload="true";link.dataset.blobUrl=url;
      link.textContent="Download "+String(file.name);
      fileHost.append(link);
    }
    for(const src of result.figures||[]){
      if(typeof src!=="string"||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src))continue;
      const img=document.createElement("img");img.src=src;img.alt="Python chart output";
      $(".python-output-figures").append(img);
    }
    status.textContent=result.error?"Error":"Finished";
  }
  runButton.addEventListener("click",()=>onRun(api));
  stopButton.addEventListener("click",()=>onStop(api));
  const editButton=$("[data-py-edit]");
  editButton.addEventListener("click",()=>{
    editing=!editing;
    stage.hidden=!editing;
    preview.hidden=editing;
    editButton.setAttribute("aria-pressed",String(editing));
    editButton.textContent=editing?"Preview":"Edit";
    if(editing){renderEditor();editor.focus()}
    else renderPreview();
    updateStatistics();
  });
  $("[data-py-wrap]").addEventListener("click",event=>{
    wrap=!wrap;
    preview.classList.toggle("soft-wrap",wrap);
    stage.classList.toggle("soft-wrap",wrap);
    editor.wrap=wrap?"soft":"off";
    event.currentTarget.setAttribute("aria-pressed",String(wrap));
    if(editing)syncScroll();
  });
  $("[data-py-lines]").addEventListener("click",event=>{
    lines=!lines;
    preview.classList.toggle("no-lines",!lines);
    stage.classList.toggle("no-lines",!lines);
    event.currentTarget.setAttribute("aria-pressed",String(lines));
  });
  $("[data-py-copy]").addEventListener("click",async event=>{
    try{
      await navigator.clipboard.writeText(editor.value);
      event.currentTarget.textContent="Copied";
    }catch{event.currentTarget.textContent="Unavailable"}
  });
  editor.addEventListener("input",updateSource);
  editor.addEventListener("scroll",syncScroll,{passive:true});
  for(const name of ["click","keyup","select"])editor.addEventListener(name,updateStatistics);
  editor.addEventListener("keydown",event=>{
    if(event.isComposing||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==="Tab"){
      event.preventDefault();
      setSourceChange(changeIndent(editor.value,editor.selectionStart,editor.selectionEnd,
        {shift:event.shiftKey}));
    }else if(event.key==="Enter"&&!event.shiftKey){
      event.preventDefault();
      setSourceChange(insertPythonNewline(editor.value,editor.selectionStart,editor.selectionEnd));
    }
  });
  const api={getSource:()=>editor.value,setRunning,showOutput,pushOutput,
    setStatus:value=>status.textContent=String(value),
    dispose:()=>{disposed=true;
      $(".python-output-files").querySelectorAll("a[data-blob-url]")
        .forEach(link=>URL.revokeObjectURL(link.dataset.blobUrl));
    }};
  if(output)showOutput({stdout:String(output)});
  renderPreview();
  updateStatistics();
  return api;
}
