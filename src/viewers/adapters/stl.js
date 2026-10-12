import {parseSTL} from "../../model/parsers/stl.js?v=9b3f94a8201e36d764f7f15b7ffd7380b1addadb";
import {renderModelWorkbench} from "../model-workbench.js?v=9b3f94a8201e36d764f7f15b7ffd7380b1addadb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
