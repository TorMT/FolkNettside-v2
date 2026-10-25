import {parseSTL} from "../../model/parsers/stl.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
import {renderModelWorkbench} from "../model-workbench.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
