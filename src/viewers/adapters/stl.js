import {parseSTL} from "../../model/parsers/stl.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
import {renderModelWorkbench} from "../model-workbench.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
