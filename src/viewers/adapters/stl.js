import {parseSTL} from "../../model/parsers/stl.js?v=4ac28c6ea1cbe04a96e79bab0cf270d33945f140";
import {renderModelWorkbench} from "../model-workbench.js?v=4ac28c6ea1cbe04a96e79bab0cf270d33945f140";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
