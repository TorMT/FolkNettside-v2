import {parseSTL} from "../../model/parsers/stl.js?v=5e47924d6f048707c5a3d870121cf70c2cc9c6fc";
import {renderModelWorkbench} from "../model-workbench.js?v=5e47924d6f048707c5a3d870121cf70c2cc9c6fc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
