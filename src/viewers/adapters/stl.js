import {parseSTL} from "../../model/parsers/stl.js?v=d733aac0b240e08c083a1c6b644db8cdb2f67570";
import {renderModelWorkbench} from "../model-workbench.js?v=d733aac0b240e08c083a1c6b644db8cdb2f67570";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
