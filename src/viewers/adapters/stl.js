import {parseSTL} from "../../model/parsers/stl.js?v=cdfaa885e0a338fe115dc5c63770a6c7facb4745";
import {renderModelWorkbench} from "../model-workbench.js?v=cdfaa885e0a338fe115dc5c63770a6c7facb4745";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
