import {parseSTL} from "../../model/parsers/stl.js?v=1b774962b35bf90b16b099cda4efa03bb73460a3";
import {renderModelWorkbench} from "../model-workbench.js?v=1b774962b35bf90b16b099cda4efa03bb73460a3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
