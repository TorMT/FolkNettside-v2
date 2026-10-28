import {parseSTL} from "../../model/parsers/stl.js?v=9803e61e702b8eb17b52157c4df7d7fc1bf6bcb4";
import {renderModelWorkbench} from "../model-workbench.js?v=9803e61e702b8eb17b52157c4df7d7fc1bf6bcb4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
