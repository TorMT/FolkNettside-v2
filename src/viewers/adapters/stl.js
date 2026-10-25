import {parseSTL} from "../../model/parsers/stl.js?v=6579e44096be500c7c0b643d3313056d4b731598";
import {renderModelWorkbench} from "../model-workbench.js?v=6579e44096be500c7c0b643d3313056d4b731598";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
