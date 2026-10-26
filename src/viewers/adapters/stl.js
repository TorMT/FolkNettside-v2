import {parseSTL} from "../../model/parsers/stl.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {renderModelWorkbench} from "../model-workbench.js?v=926c03b74b4f91155d335575219cf17720aedde5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
