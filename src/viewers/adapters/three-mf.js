import {parse3MF} from "../../model/parsers/three-mf.js?v=5432ce3012ffa104309b526dbb4601a3b31b5eec";
import {renderModelWorkbench} from "../model-workbench.js?v=5432ce3012ffa104309b526dbb4601a3b31b5eec";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
