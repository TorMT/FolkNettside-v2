import {fetchText} from "../utils.js";
import {mountPythonCodeCell} from "../python-code-cell.js";
import {createPythonSession} from "../python-session.js";
import {createDomFinder} from "../dom-search.js";

export async function render(container,resource,{sessionFactory=createPythonSession}={}){
  const source=resource.sourceText!==undefined?String(resource.sourceText):await fetchText(resource.path||resource.url);
  const session=sessionFactory();
  container.innerHTML=`<section class="python-workbench">
    <div class="python-workbench-head"><div><strong>Python workbench</strong>
      <p>Pyodide in a dedicated Worker · runs only when you select Run · output stays in this tab</p></div>
      <div class="python-workbench-actions">
        <button type="button" id="python-open-vscode">VS Code</button>
        <button type="button" id="python-download">Save .py</button>
        <label class="python-upload-label">Add data / .py modules<input id="python-local-files" type="file" multiple hidden></label>
        <button type="button" id="python-restart">Reset Python</button>
      </div>
    </div>
    <div id="python-script-cell"></div>
    <p class="python-runtime-notice">Use only code you trust. A Web Worker keeps the page responsive but is not a security sandbox. Packages need an internet connection on first use.</p>
  </section>`;
  const host=container.querySelector("#python-script-cell");
  const cell=mountPythonCodeCell(host,{
    source,title:resource.label||resource.name||"Python script",
    onRun:async api=>{
      api.setRunning(true);
      try{
        const value=await session.run(api.getSource(),{status:message=>api.setStatus(message)});
        api.showOutput(value);
      }catch(error){api.showOutput({error:String(error?.message||error),
        stdout:error.stdout||"",stderr:error.stderr||String(error)})}
      finally{api.setRunning(false)}
    },
    onStop:api=>{
      session.stop();api.setRunning(false);api.setStatus("Stopped · Python session reset");
    }
  });
  container.querySelector("#python-open-vscode").addEventListener("click",()=>{
    const target=resource.path||resource.url;
    const url=target?"https://vscode.dev/?url="+encodeURIComponent(
      new URL(target,location.href).href):"https://vscode.dev/";
    window.open(url,"_blank","noopener");
  });
  container.querySelector("#python-download").addEventListener("click",()=>{
    const blob=new Blob([cell.getSource()],{type:"text/x-python;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=(resource.name||"script.py").replace(/[^\w.\-]+/g,"_");
    link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  });
  if(resource.initialEdit)host.querySelector("[data-py-edit]")?.click();
  const localFiles=container.querySelector("#python-local-files");
  const fileStatus=document.createElement("span");
  fileStatus.className="python-files-status";
  localFiles.closest("label").append(fileStatus);
  localFiles.addEventListener("change",async()=>{
    const selected=[...localFiles.files||[]];
    if(!selected.length)return;
    try{
      const files=[];
      for(const file of selected)files.push({
        name:file.name,data:new Uint8Array(await file.arrayBuffer())
      });
      const result=await session.mount(files);
      fileStatus.textContent=result.mounted+" file(s) mounted";
      cell.setStatus("Data and module files ready");
    }catch(error){
      fileStatus.textContent=String(error?.message||error);
      cell.setStatus("File import error");
    }
    localFiles.value="";
  });
  container.querySelector("#python-restart").addEventListener("click",()=>{
    session.stop();cell.setStatus("Runtime reset");cell.setRunning(false);
  });
  return {info:"Python · "+source.split("\n").length+" lines · editable, Run / Stop",
    cleanup:()=>{cell.dispose();session.dispose()},
    actions:{find:createDomFinder(container)}
  };
}
