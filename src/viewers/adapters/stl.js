import {parseSTL} from "../../model/parsers/stl.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";
import {renderModelWorkbench} from "../model-workbench.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
