import {parseSTL} from "../../model/parsers/stl.js?v=91086570bfa7f858e2e4bc4374c580e25e68ad88";
import {renderModelWorkbench} from "../model-workbench.js?v=91086570bfa7f858e2e4bc4374c580e25e68ad88";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
