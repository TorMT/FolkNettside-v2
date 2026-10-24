import {parseSTL} from "../../model/parsers/stl.js?v=b67b252dd6fbc40137d93e0430b40fd3e1089c77";
import {renderModelWorkbench} from "../model-workbench.js?v=b67b252dd6fbc40137d93e0430b40fd3e1089c77";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
