import {parseSTL} from "../../model/parsers/stl.js?v=2542cb51ad49a595d985f3bd5ec42db298c97f5c";
import {renderModelWorkbench} from "../model-workbench.js?v=2542cb51ad49a595d985f3bd5ec42db298c97f5c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
