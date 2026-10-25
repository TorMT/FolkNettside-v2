import {parseSTL} from "../../model/parsers/stl.js?v=24ac11a85758fee7db1791a20e0421b78876821b";
import {renderModelWorkbench} from "../model-workbench.js?v=24ac11a85758fee7db1791a20e0421b78876821b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
