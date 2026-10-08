import {parseSTL} from "../../model/parsers/stl.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3";
import {renderModelWorkbench} from "../model-workbench.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
