import {escapeHTML} from "./utils.js";
import {getHighlighter} from "../vendor/highlight.js";

// Shared editable/preview code cell for .py and .ipynb.
export function mountPythonCodeCell(container,{
  source="",title="Python",onRun=async()=>{},onStop=()=>{},output=""
}={}){
  const initial=String(source);
  container.innerHTML=`<div class="python-cell">
    <div class="python-cell-toolbar">
      <strong>${escapeHTML(title)}</strong>
      <button type="button" data-py-run>Run</button>
      <button type="button" data-py-stop>Stop</button>
      <button type="button" data-py-edit>Edit</button>
      <button type="button" data-py-wrap aria-pressed="false">Wrap</button>
      <button type="button" data-py-lines aria-pressed="true">Lines</button>
      <button type="button" data-py-copy>Copy</button>
      <span class="python-cell-status" role="status">Ready</span>
    </div>
    <div class="python-cell-body">
      <pre class="python-code-preview"><code></code></pre>
      <textarea class="python-code-edit" spellcheck="false" aria-label="Editable Python source" hidden></textarea>
    </div>
    <section class="python-cell-output" aria-label="Python output">
      <div class="python-output-label">Output</div>
      <pre class="python-output-text"></pre>
      <div class="python-output-figures"></div>
    </section>
  </div>`;
  const $=query=>container.querySelector(query);
  const editor=$(".python-code-edit"),preview=$(".python-code-preview");
  const code=preview.querySelector("code"),status=$(".python-cell-status");
  const runButton=$("[data-py-run]"),stopButton=$("[data-py-stop]");
  editor.value=initial;let wrap=false,lines=true,disposed=false;
  const escapeLines=(html)=>html.split("\n").map((line,index)=>
    `<span class="python-code-line"><span class="python-code-number">${index+1}</span><span class="python-code-content">${line||" "}</span></span>`
  ).join("\n");
  async function refresh(){
    const value=editor.value;
    // Render readable code and line numbers immediately; highlighting may
    // arrive asynchronously and can fail offline without blanking the UI.
    code.innerHTML=escapeLines(escapeHTML(value));
    preview.classList.toggle("no-lines",!lines);
    preview.classList.toggle("soft-wrap",wrap);
    try{
      const hljs=await getHighlighter();
      const html=hljs.highlight(value,{language:"python",ignoreIllegals:true}).value;
      if(!disposed&&editor.value===value)code.innerHTML=escapeLines(html);
    }catch{/* fallback is already visible */}
  }
  function setRunning(running){
    runButton.disabled=running;
    stopButton.disabled=false; // Stop also resets an idle Python interpreter.
    status.textContent=running?"Running…":"Ready";
  }
  function showOutput(result={}){
    const stdout=String(result.stdout||""),stderr=String(result.stderr||"");
    const tail=result.result==null?"":String(result.result);
    const raw=[stdout,tail,stderr].filter(Boolean).join("\n");
    $(".python-output-text").textContent=raw||"No text output";
    $(".python-output-text").classList.toggle("has-error",Boolean(stderr||result.error));
    $(".python-output-figures").replaceChildren();
    for(const src of result.figures||[]){
      if(typeof src!=="string"||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src))continue;
      const img=document.createElement("img");img.src=src;img.alt="Python chart output";
      $(".python-output-figures").append(img);
    }
    if(result.error)status.textContent="Error";
    else status.textContent="Finished";
  }
  runButton.addEventListener("click",()=>onRun(api));
  stopButton.addEventListener("click",()=>onStop(api));
  $("[data-py-edit]").addEventListener("click",event=>{
    const active=editor.hidden;
    editor.hidden=!active;preview.hidden=active;
    event.currentTarget.textContent=active?"Preview":"Edit";
    if(!active)refresh();else editor.focus();
  });
  $("[data-py-wrap]").addEventListener("click",event=>{
    wrap=!wrap;preview.classList.toggle("soft-wrap",wrap);
    editor.classList.toggle("soft-wrap",wrap);
    event.currentTarget.setAttribute("aria-pressed",String(wrap));
  });
  $("[data-py-lines]").addEventListener("click",event=>{
    lines=!lines;preview.classList.toggle("no-lines",!lines);
    event.currentTarget.setAttribute("aria-pressed",String(lines));
  });
  $("[data-py-copy]").addEventListener("click",async event=>{
    try{await navigator.clipboard.writeText(editor.value);event.currentTarget.textContent="Copied"}
    catch{event.currentTarget.textContent="Unavailable"}
  });
  const api={getSource:()=>editor.value,setRunning,showOutput,setStatus:s=>status.textContent=String(s),
    dispose:()=>{disposed=true}};
  if(output)showOutput({stdout:String(output)});
  refresh();
  return api;
}
