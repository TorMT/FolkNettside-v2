import {parseSTL} from "../../model/parsers/stl.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
import {renderModelWorkbench} from "../model-workbench.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
