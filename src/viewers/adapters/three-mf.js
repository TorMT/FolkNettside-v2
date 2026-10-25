import {parse3MF} from "../../model/parsers/three-mf.js?v=933da81f89017f643820b82863bb31f511c8caf0";
import {renderModelWorkbench} from "../model-workbench.js?v=933da81f89017f643820b82863bb31f511c8caf0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
