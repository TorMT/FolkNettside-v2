import {parseSTL} from "../../model/parsers/stl.js?v=7d13052833027ac258e1bfc0923cb2e10b3fb3fc";
import {renderModelWorkbench} from "../model-workbench.js?v=7d13052833027ac258e1bfc0923cb2e10b3fb3fc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
