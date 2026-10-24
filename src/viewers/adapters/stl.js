import {parseSTL} from "../../model/parsers/stl.js?v=5768ea9d018ce90322c83736d97c26876967a998";
import {renderModelWorkbench} from "../model-workbench.js?v=5768ea9d018ce90322c83736d97c26876967a998";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
