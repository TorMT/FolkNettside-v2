import {parseSTL} from "../../model/parsers/stl.js?v=e9fc2476ea219c59d6a44293b891c44b1dcdc4d9";
import {renderModelWorkbench} from "../model-workbench.js?v=e9fc2476ea219c59d6a44293b891c44b1dcdc4d9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
