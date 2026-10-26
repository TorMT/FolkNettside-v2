import {pythonSourceURL} from "../python-source.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {escapeHTML,fetchJSON} from "../utils.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {createDomFinder} from "../dom-search.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {mountPythonCodeCell} from "../python-code-cell.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {createPythonSession} from "../python-session.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {notebookMarkdownHTML} from "../notebook-markdown.js?v=926c03b74b4f91155d335575219cf17720aedde5";

export const cellText=value=>Array.isArray(value)?value.join(""):String(value||"");
export function renderNotebookOutput(output={}){
  const stdout=cellText(output.text)||cellText(output.data?.["text/plain"]);
  const source=output.data?.["image/png"];
  const image=Array.isArray(source)?source.join(""):source;
  let html=stdout?`<pre class="notebook-saved-output">${escapeHTML(stdout)}</pre>`:"";
  if(typeof image==="string"&&/^[a-zA-Z0-9+/=\r\n]+$/.test(image)){
    html+=`<img class="notebook-saved-plot" src="data:image/png;base64,${image.replace(/\s/g,"")}" alt="Saved notebook plot">`;
  }
  if(output.ename||output.evalue){
    html+=`<pre class="notebook-saved-error">${escapeHTML(output.ename||"Error")}: ${escapeHTML(output.evalue||"")}</pre>`;
  }
  return html;
}
export function renderMarkdownCell(source){
  return notebookMarkdownHTML(cellText(source));
}
export async function render(container,resource,{sessionFactory=createPythonSession}={}){
  const notebook=await fetchJSON(resource.path||resource.url);
  const cells=Array.isArray(notebook.cells)?notebook.cells:[];
  const session=sessionFactory(),editable=[];
  let stopped=false,busy=false,disposed=false;
  container.innerHTML=`<section class="python-workbench notebook-workbench">
    <div class="python-workbench-head">
      <div><strong>Jupyter notebook</strong><p>${cells.length} cells · outputs from the file stay visible · edit and rerun code cells</p></div>
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
        sourceURL:pythonSourceURL(resource,document.baseURI),
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
    const data=cells[i],section=document.createElement("section");
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
        const saved=document.createElement("section");saved.className="notebook-saved";
        saved.innerHTML='<div class="python-output-label">Saved notebook output</div>'+
          data.outputs.map(renderNotebookOutput).join("");
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
  return {info:cells.length+" cells · "+editable.length+" executable Python",
    cleanup:()=>{disposed=true;stopped=true;editable.forEach(x=>x.cell.dispose());session.dispose()},
    actions:{find:createDomFinder(container)}
  };
}
