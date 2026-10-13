import {parseSTL} from "../../model/parsers/stl.js?v=82a1a72c1f68dd9603f9b3b806fc26a70976f517";
import {renderModelWorkbench} from "../model-workbench.js?v=82a1a72c1f68dd9603f9b3b806fc26a70976f517";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
