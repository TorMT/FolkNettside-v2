import {parseSTL} from "../../model/parsers/stl.js?v=9a712f5cf5e5cbc34435fa7864ed6a73ae36fe17";
import {renderModelWorkbench} from "../model-workbench.js?v=9a712f5cf5e5cbc34435fa7864ed6a73ae36fe17";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
