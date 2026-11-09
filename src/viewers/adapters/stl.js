import {parseSTL} from "../../model/parsers/stl.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
import {renderModelWorkbench} from "../model-workbench.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
