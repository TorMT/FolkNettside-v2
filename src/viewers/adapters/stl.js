import {parseSTL} from "../../model/parsers/stl.js?v=18070131bbf485bf1f82a2087936d2bb01cc4150";
import {renderModelWorkbench} from "../model-workbench.js?v=18070131bbf485bf1f82a2087936d2bb01cc4150";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
