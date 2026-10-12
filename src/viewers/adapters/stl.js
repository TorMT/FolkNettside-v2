import {parseSTL} from "../../model/parsers/stl.js?v=c15daa64938f549f0506ed4722769aeb54bc3404";
import {renderModelWorkbench} from "../model-workbench.js?v=c15daa64938f549f0506ed4722769aeb54bc3404";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
