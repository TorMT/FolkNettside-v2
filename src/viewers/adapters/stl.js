import {parseSTL} from "../../model/parsers/stl.js?v=fa3500a4cc0e83196536ff6c74795c68626dc2a0";
import {renderModelWorkbench} from "../model-workbench.js?v=fa3500a4cc0e83196536ff6c74795c68626dc2a0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
