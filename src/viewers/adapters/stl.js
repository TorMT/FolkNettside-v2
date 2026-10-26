import {parseSTL} from "../../model/parsers/stl.js?v=18d3dccfa91741e8114ab5c830c6a097de855221";
import {renderModelWorkbench} from "../model-workbench.js?v=18d3dccfa91741e8114ab5c830c6a097de855221";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
