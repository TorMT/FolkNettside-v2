import {parseSTL} from "../../model/parsers/stl.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
import {renderModelWorkbench} from "../model-workbench.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
