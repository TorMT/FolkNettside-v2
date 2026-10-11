import {parseSTL} from "../../model/parsers/stl.js?v=0f2c46fb5407953a6027ee84752684d80ac98516";
import {renderModelWorkbench} from "../model-workbench.js?v=0f2c46fb5407953a6027ee84752684d80ac98516";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
