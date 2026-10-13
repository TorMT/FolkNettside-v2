import {parseSTL} from "../../model/parsers/stl.js?v=602370baadd79971cc3da5fd5d7fa1f9c9d34319";
import {renderModelWorkbench} from "../model-workbench.js?v=602370baadd79971cc3da5fd5d7fa1f9c9d34319";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
