import {parseSTL} from "../../model/parsers/stl.js?v=07f63084a4ab14484952a5235704e90c5ed0ce2a";
import {renderModelWorkbench} from "../model-workbench.js?v=07f63084a4ab14484952a5235704e90c5ed0ce2a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
