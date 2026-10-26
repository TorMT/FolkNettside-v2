import {parseSTL} from "../../model/parsers/stl.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";
import {renderModelWorkbench} from "../model-workbench.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
