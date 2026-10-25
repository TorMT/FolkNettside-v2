import {parseSTL} from "../../model/parsers/stl.js?v=2aee1c04e571f98e6d36fae0f631616b49ece795";
import {renderModelWorkbench} from "../model-workbench.js?v=2aee1c04e571f98e6d36fae0f631616b49ece795";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
