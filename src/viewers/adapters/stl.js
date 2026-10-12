import {parseSTL} from "../../model/parsers/stl.js?v=722842f9f49e1f04b018fca938159df83a3a8ca3";
import {renderModelWorkbench} from "../model-workbench.js?v=722842f9f49e1f04b018fca938159df83a3a8ca3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
