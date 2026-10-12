import {parseSTL} from "../../model/parsers/stl.js?v=b96fa6cba653e984ad1403e44f7eb36b63d5bb31";
import {renderModelWorkbench} from "../model-workbench.js?v=b96fa6cba653e984ad1403e44f7eb36b63d5bb31";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
