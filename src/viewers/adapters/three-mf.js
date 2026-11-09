import {parse3MF} from "../../model/parsers/three-mf.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";
import {renderModelWorkbench} from "../model-workbench.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
