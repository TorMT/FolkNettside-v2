import {fetchText,extension} from "../utils.js";
import {mountPythonCodeCell} from "../python-code-cell.js";
import {createPythonSession} from "../python-session.js";
import {createDomFinder} from "../dom-search.js";

export async function render(container,resource,{sessionFactory=createPythonSession}={}){
  const source=await fetchText(resource.path||resource.url);
  const session=sessionFactory();
  container.innerHTML=`<section class="python-workbench">
    <div class="python-workbench-head"><div><strong>Python workbench</strong>
      <p>Pyodide in a dedicated Worker · runs only when you select Run · output stays in this tab</p></div>
      <button type="button" id="python-restart">Reset Python</button>
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
  container.querySelector("#python-restart").addEventListener("click",()=>{
    session.stop();cell.setStatus("Runtime reset");cell.setRunning(false);
  });
  return {info:"Python · "+source.split("\n").length+" lines · editable, Run / Stop",
    cleanup:()=>{cell.dispose();session.dispose()},
    actions:{find:createDomFinder(container)}
  };
}
