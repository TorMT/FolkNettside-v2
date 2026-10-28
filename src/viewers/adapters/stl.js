import {parseSTL} from "../../model/parsers/stl.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";
import {renderModelWorkbench} from "../model-workbench.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
