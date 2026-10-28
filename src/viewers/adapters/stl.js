import {parseSTL} from "../../model/parsers/stl.js?v=12f46a197391dc034f9aa7438b7fbd238188581f";
import {renderModelWorkbench} from "../model-workbench.js?v=12f46a197391dc034f9aa7438b7fbd238188581f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
