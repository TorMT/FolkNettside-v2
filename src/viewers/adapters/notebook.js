import {pythonSourceURL} from "../python-source.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {escapeHTML,fetchJSON} from "../utils.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {publicCodePreviewURL,publicCodeRelayURL} from "../ntnu-public-code.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {createDomFinder} from "../dom-search.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {mountPythonCodeCell} from "../python-code-cell.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {createPythonSession} from "../python-session.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {notebookMarkdownHTML} from "../notebook-markdown.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {notebookPreviewCells,notebookSavedOutputs,limitedNotebookText,notebookPNGData} from "../notebook-preview-limits.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";

export const cellText=value=>Array.isArray(value)?value.join(""):String(value||"");
export function renderNotebookOutput(output={}){
  const candidate=output?.text||output?.data?.["text/plain"];
  const {text:stdout,truncated}=limitedNotebookText(candidate);
  const {data:image,omitted:imageOmitted}=notebookPNGData(output?.data?.["image/png"]);
  let html=stdout?`<pre class="notebook-saved-output">${escapeHTML(stdout)}</pre>`:"";
  if(truncated)html+='<p class="muted notebook-output-truncated" role="note">Saved text shortened in preview; open the original notebook for full output.</p>';
  if(image)html+=`<img class="notebook-saved-plot" src="data:image/png;base64,${image}" alt="Saved notebook plot">`;
  else if(imageOmitted)html+='<p class="muted notebook-output-truncated" role="note">Large saved plot omitted from preview; open the original notebook.</p>';
  if(output?.ename||output?.evalue){
    const detail=limitedNotebookText(String(output.ename||"Error")+": "+String(output.evalue||""));
    html+=`<pre class="notebook-saved-error">${escapeHTML(detail.text)}</pre>`;
    if(detail.truncated)html+='<p class="muted notebook-output-truncated" role="note">Saved error shortened in preview.</p>';
  }
  return html;
}
export function renderMarkdownCell(source){
  return notebookMarkdownHTML(cellText(source));
}
export async function render(container,resource,{sessionFactory=createPythonSession}={}){
  const notebook=await fetchJSON(publicCodePreviewURL(resource));
  const preview=notebookPreviewCells(notebook.cells);
  const cells=preview.items;
  const session=sessionFactory(),editable=[];
  const siblingRelayURL=publicCodeRelayURL(resource);
  let stopped=false,busy=false,disposed=false;
  container.innerHTML=`<section class="python-workbench notebook-workbench">
    <div class="python-workbench-head">
      <div><strong>Jupyter notebook</strong><p>${preview.total} cells · preview ${cells.length} · edit and rerun visible code cells</p></div>
      <div class="python-workbench-actions">
        <button type="button" data-nb-run-all>Run all</button>
        <button type="button" data-nb-stop>Stop</button>
        <button type="button" data-nb-reset>Reset Python</button>
        <button type="button" data-nb-collapse aria-expanded="true">Collapse code</button>
      </div>
    </div>
    <label class="python-stdin-label">Input lines for Python input() (one response per line)
      <textarea data-nb-stdin spellcheck="false" rows="2" placeholder="Optional stdin for the next code cell"></textarea>
    </label>
    ${preview.omitted?'<p class="python-runtime-notice notebook-output-truncated" role="status">Preview limited to the first '+cells.length+' cells ('+preview.omitted+' omitted). Open original for the complete notebook.</p>':""}
    <div class="notebook-cells"></div>
    <p class="python-runtime-notice">Execution uses Pyodide in a disposable Web Worker and only starts when requested. Run trusted code only.</p>
  </section>`;
  const wrap=container.querySelector(".notebook-cells");
  const runAll=container.querySelector("[data-nb-run-all]");
  const stop=container.querySelector("[data-nb-stop]");
  const collapse=container.querySelector("[data-nb-collapse]");
  function toggle(running){
    busy=running;runAll.disabled=running;
    for(const {cell} of editable)cell.setRunning(running);
  }
  async function execute(entry){
    if(disposed||stopped)return;
    entry.cell.setStatus("Executing…");
    try{
      const result=await session.run(entry.cell.getSource(),{
        status:s=>entry.cell.setStatus(s),
        stdin:container.querySelector("[data-nb-stdin]")?.value||"",
        sourceURL:siblingRelayURL?resource.url:pythonSourceURL(resource,document.baseURI),
        siblingRelayURL:siblingRelayURL||"",
        onOutput:output=>entry.cell.pushOutput(output)
      });
      if(!disposed&&!stopped)entry.cell.showOutput(result);
    }catch(error){
      if(!stopped&&!disposed)entry.cell.showOutput({error:String(error?.message||error),
        stdout:error.stdout,stderr:error.stderr||String(error)});
      if(!stopped)throw error;
    }
  }
  for(let i=0;i<cells.length;i++){
    const data=cells[i]&&typeof cells[i]==="object"?cells[i]:{},section=document.createElement("section");
    section.className="notebook-entry nb-cell";section.dataset.cellIndex=String(i);
    const title=document.createElement("div");title.className="nb-kind";
    title.textContent=(data.cell_type||"cell")+" · cell "+(i+1);
    section.append(title);
    const body=document.createElement("div");body.className="notebook-entry-body";
    section.append(body);wrap.append(section);
    if(data.cell_type==="code"){
      const cell=mountPythonCodeCell(body,{
        source:cellText(data.source),
        title:"In ["+(Number.isInteger(data.execution_count)?data.execution_count:i+1)+"]",
        maxEditorHeight:360,
        onRun:async self=>{
          if(busy)return;stopped=false;toggle(true);
          try{await execute({cell:self})}
          catch{/* output already reported to this cell */}
          finally{toggle(false)}
        },
        onStop:()=>{stopped=true;session.stop();toggle(false)}
      });
      if(Array.isArray(data.outputs)&&data.outputs.length){
        const previewOutputs=notebookSavedOutputs(data.outputs);
        const saved=document.createElement("section");saved.className="notebook-saved";
        saved.innerHTML='<div class="python-output-label">Saved notebook output</div>'+
          previewOutputs.items.map(renderNotebookOutput).join("")+
          (previewOutputs.omitted?'<p class="muted notebook-output-truncated" role="note">'+previewOutputs.omitted+' additional saved outputs omitted from preview. Open original for all outputs.</p>':"");
        body.append(saved);
      }
      editable.push({cell,index:i});
    }else if(data.cell_type==="markdown"){
      body.className+=" notebook-markdown";
      body.innerHTML=renderMarkdownCell(data.source);
    }else{
      const pre=document.createElement("pre");pre.textContent=cellText(data.source);body.append(pre);
    }
  }
  collapse?.addEventListener("click",()=>{
    const collapsed=collapse.getAttribute("aria-expanded")==="true";
    collapse.setAttribute("aria-expanded",String(!collapsed));
    collapse.textContent=collapsed?"Expand code":"Collapse code";
    wrap.classList.toggle("notebook-code-collapsed",collapsed);
  });
  runAll.addEventListener("click",async()=>{
    if(busy)return;stopped=false;toggle(true);
    try{
      for(const entry of editable){
        if(disposed||stopped)break;
        await execute(entry);
      }
    }catch{/* stop at failed cell; preserve traceback and previous output */}
    finally{toggle(false)}
  });
  stop.addEventListener("click",()=>{stopped=true;session.stop();toggle(false)});
  container.querySelector("[data-nb-reset]").addEventListener("click",()=>{
    stopped=true;session.stop();toggle(false);
    for(const {cell} of editable)cell.setStatus("Python reset");
  });
  return {info:preview.total+" cells · "+editable.length+" executable in preview"+
      (preview.omitted?" · "+preview.omitted+" omitted":""),
    cleanup:()=>{disposed=true;stopped=true;editable.forEach(x=>x.cell.dispose());session.dispose()},
    actions:{find:createDomFinder(container)}
  };
}
