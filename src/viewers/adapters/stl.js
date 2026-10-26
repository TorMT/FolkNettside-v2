import {parseSTL} from "../../model/parsers/stl.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";
import {renderModelWorkbench} from "../model-workbench.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
