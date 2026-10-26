import {parseSTL} from "../../model/parsers/stl.js?v=cc40b2b6f38f4b1e795cf2a77b6f7279339e38e0";
import {renderModelWorkbench} from "../model-workbench.js?v=cc40b2b6f38f4b1e795cf2a77b6f7279339e38e0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
