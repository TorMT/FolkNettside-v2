import {parseSTL} from "../../model/parsers/stl.js?v=684ee9d5405f1e764659228f07aa3330df9ccb27";
import {renderModelWorkbench} from "../model-workbench.js?v=684ee9d5405f1e764659228f07aa3330df9ccb27";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
