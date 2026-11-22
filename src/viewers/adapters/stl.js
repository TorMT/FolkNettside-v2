import {parseSTL} from "../../model/parsers/stl.js?v=60c2ff1e468a5162296feb3b1992c444272810c3";
import {renderModelWorkbench} from "../model-workbench.js?v=60c2ff1e468a5162296feb3b1992c444272810c3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
