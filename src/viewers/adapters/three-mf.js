import {parse3MF} from "../../model/parsers/three-mf.js?v=5720acd5be726fd5bdd846a15604e9a058389473";
import {renderModelWorkbench} from "../model-workbench.js?v=5720acd5be726fd5bdd846a15604e9a058389473";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
