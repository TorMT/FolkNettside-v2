import {parseSTL} from "../../model/parsers/stl.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
import {renderModelWorkbench} from "../model-workbench.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
