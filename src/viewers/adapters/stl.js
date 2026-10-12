import {parseSTL} from "../../model/parsers/stl.js?v=d6a52c819161b70263a3229136a2315c3bf243ce";
import {renderModelWorkbench} from "../model-workbench.js?v=d6a52c819161b70263a3229136a2315c3bf243ce";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
