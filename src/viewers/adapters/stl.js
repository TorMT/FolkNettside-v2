import {parseSTL} from "../../model/parsers/stl.js?v=93c51a9ec39df9dd75862e8e2072639ecdd7d0e5";
import {renderModelWorkbench} from "../model-workbench.js?v=93c51a9ec39df9dd75862e8e2072639ecdd7d0e5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
