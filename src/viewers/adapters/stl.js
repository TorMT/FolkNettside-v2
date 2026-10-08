import {parseSTL} from "../../model/parsers/stl.js?v=5608baab66976446246f638432ec57af03b6a1ec";
import {renderModelWorkbench} from "../model-workbench.js?v=5608baab66976446246f638432ec57af03b6a1ec";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
