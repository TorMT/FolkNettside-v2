import {parseSTL} from "../../model/parsers/stl.js?v=9939f0369f61cd3277d2b6cb7480abd90d2520c0";
import {renderModelWorkbench} from "../model-workbench.js?v=9939f0369f61cd3277d2b6cb7480abd90d2520c0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
