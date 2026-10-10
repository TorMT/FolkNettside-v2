import {parse3MF} from "../../model/parsers/three-mf.js?v=28848fc2e648e3c06003a0bb024ccfd161791d60";
import {renderModelWorkbench} from "../model-workbench.js?v=28848fc2e648e3c06003a0bb024ccfd161791d60";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
