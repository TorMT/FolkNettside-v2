import {parseSTL} from "../../model/parsers/stl.js?v=06514953be30c8ec6b9539f28f9a4e3e637313e4";
import {renderModelWorkbench} from "../model-workbench.js?v=06514953be30c8ec6b9539f28f9a4e3e637313e4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
