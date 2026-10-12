import {pythonSourceURL} from "../python-source.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {pythonUploadPaths} from "../python-folder-paths.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {fetchText} from "../utils.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {mountPythonCodeCell} from "../python-code-cell.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {createPythonSession} from "../python-session.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {createDomFinder} from "../dom-search.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";

export async function render(container,resource,{sessionFactory=createPythonSession}={}){
  const source=resource.sourceText!==undefined?String(resource.sourceText):await fetchText(resource.path||resource.url);
  const session=sessionFactory();
  container.innerHTML=`<section class="python-workbench">
    <div class="python-workbench-head"><div><strong>Python workbench</strong>
      <p>Python Worker · imports nearby .py files automatically · plt.show() displays inline · Run/Stop</p></div>
      <div class="python-workbench-actions">
        <button type="button" id="python-open-vscode">VS Code</button>
        <button type="button" id="python-download">Save .py</button>
        <label class="python-upload-label">Add data / .py modules<input id="python-local-files" type="file" multiple hidden></label>
        <label class="python-upload-label">Add folder (include nested packages)<input id="python-local-folder" type="file" webkitdirectory directory multiple hidden></label>
        <button type="button" id="python-restart">Reset Python</button>
      </div>
    </div>
    <div id="python-script-cell"></div>
    <label class="python-stdin-label">Input lines for Python input() (one response per line)
      <textarea id="python-stdin" spellcheck="false" rows="2" placeholder="Optional stdin lines"></textarea>
    </label>
    <p class="python-runtime-notice">Use only code you trust. Sibling Python modules and data are loaded automatically from this file’s own folder when available on the same site. Other files can be added manually. A Worker is not a security sandbox. Pyodide packages may need internet access.</p>
  </section>`;
  const host=container.querySelector("#python-script-cell");
  const cell=mountPythonCodeCell(host,{
    source,title:resource.label||resource.name||"Python script",
    onRun:async api=>{
      api.setRunning(true);
      try{
        const value=await session.run(api.getSource(),{
          status:message=>api.setStatus(message),
          stdin:container.querySelector("#python-stdin").value,
          sourceURL:pythonSourceURL(resource,document.baseURI),
          onOutput:output=>api.pushOutput(output)
        });
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
  const localFolder=container.querySelector("#python-local-folder");
  const addFiles=async (input,{folder=false}={})=>{
    const selected=[...input.files||[]];
    if(!selected.length)return;
    try{
      if(selected.length>40||selected.some(file=>file.size>8_000_000)||
         selected.reduce((size,file)=>size+file.size,0)>25_000_000)
        throw new Error("Choose at most 40 files, 8 MB per file, 25 MB total");
      const files=[];
      for(const item of pythonUploadPaths(selected,{folder}))files.push({
        name:item.name,data:new Uint8Array(await item.file.arrayBuffer())
      });
      const result=await session.mount(files);
      fileStatus.textContent=result.mounted+" file(s) mounted";
      cell.setStatus("Data and module files ready");
    }catch(error){
      fileStatus.textContent=String(error?.message||error);
      cell.setStatus("File import error");
    }
    input.value="";
  };
  localFiles.addEventListener("change",()=>addFiles(localFiles));
  localFolder.addEventListener("change",()=>addFiles(localFolder,{folder:true}));
  container.querySelector("#python-restart").addEventListener("click",()=>{
    session.stop();cell.setStatus("Runtime reset");cell.setRunning(false);
  });
  return {info:"Python · "+source.split("\n").length+" lines · editable, Run / Stop",
    cleanup:()=>{cell.dispose();session.dispose()},
    actions:{find:createDomFinder(container)}
  };
}
