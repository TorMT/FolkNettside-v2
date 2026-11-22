import {parseSTL} from "../../model/parsers/stl.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
import {renderModelWorkbench} from "../model-workbench.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
