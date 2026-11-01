import {parseSTL} from "../../model/parsers/stl.js?v=ebe616383fa17ea6407d55139d89705508f6d741";
import {renderModelWorkbench} from "../model-workbench.js?v=ebe616383fa17ea6407d55139d89705508f6d741";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
