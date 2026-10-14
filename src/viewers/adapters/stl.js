import {parseSTL} from "../../model/parsers/stl.js?v=53b596ca51970a6e00d540ea88086fb2c15a8587";
import {renderModelWorkbench} from "../model-workbench.js?v=53b596ca51970a6e00d540ea88086fb2c15a8587";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
