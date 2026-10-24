import {parse3MF} from "../../model/parsers/three-mf.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";
import {renderModelWorkbench} from "../model-workbench.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
