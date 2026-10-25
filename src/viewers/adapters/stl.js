import {parseSTL} from "../../model/parsers/stl.js?v=6c95d0f9ab17debd70a4c6b23b55e31688aa1937";
import {renderModelWorkbench} from "../model-workbench.js?v=6c95d0f9ab17debd70a4c6b23b55e31688aa1937";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
