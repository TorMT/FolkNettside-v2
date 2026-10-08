import {parseSTL} from "../../model/parsers/stl.js?v=976e1def684b1093ba92f25ca9b33df7a0242fbd";
import {renderModelWorkbench} from "../model-workbench.js?v=976e1def684b1093ba92f25ca9b33df7a0242fbd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
