import {parseSTL} from "../../model/parsers/stl.js?v=170408c684c2a559bce2f17060d632aa89defe06";
import {renderModelWorkbench} from "../model-workbench.js?v=170408c684c2a559bce2f17060d632aa89defe06";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
