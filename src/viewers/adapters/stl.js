import {parseSTL} from "../../model/parsers/stl.js?v=e2b4e4db3eca785d7ba5da3bfbc7f8ef321cf8c5";
import {renderModelWorkbench} from "../model-workbench.js?v=e2b4e4db3eca785d7ba5da3bfbc7f8ef321cf8c5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
