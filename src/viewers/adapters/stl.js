import {parseSTL} from "../../model/parsers/stl.js?v=30d5bdf0ee310beb39404407ea7f857ed3c70497";
import {renderModelWorkbench} from "../model-workbench.js?v=30d5bdf0ee310beb39404407ea7f857ed3c70497";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
