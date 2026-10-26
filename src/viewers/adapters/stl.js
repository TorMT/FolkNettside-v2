import {parseSTL} from "../../model/parsers/stl.js?v=919cdd95cbb48d558602a55fab44fb183ae39074";
import {renderModelWorkbench} from "../model-workbench.js?v=919cdd95cbb48d558602a55fab44fb183ae39074";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
