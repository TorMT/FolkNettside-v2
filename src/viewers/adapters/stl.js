import {parseSTL} from "../../model/parsers/stl.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";
import {renderModelWorkbench} from "../model-workbench.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
