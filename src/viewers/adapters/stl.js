import {parseSTL} from "../../model/parsers/stl.js?v=81bf6925603e3b42a2a867d2066d3707aa4bc792";
import {renderModelWorkbench} from "../model-workbench.js?v=81bf6925603e3b42a2a867d2066d3707aa4bc792";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
