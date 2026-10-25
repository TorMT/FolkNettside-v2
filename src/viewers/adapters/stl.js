import {parseSTL} from "../../model/parsers/stl.js?v=6604a1d2cf5eed11ba6c4f90f3662edbfe14b3fa";
import {renderModelWorkbench} from "../model-workbench.js?v=6604a1d2cf5eed11ba6c4f90f3662edbfe14b3fa";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
