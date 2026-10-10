import {parseSTL} from "../../model/parsers/stl.js?v=8a0c7a44c5550a3953bad9f92edbef66b5c57192";
import {renderModelWorkbench} from "../model-workbench.js?v=8a0c7a44c5550a3953bad9f92edbef66b5c57192";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
