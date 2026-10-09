import {parseSTL} from "../../model/parsers/stl.js?v=609330a9305f060859d0eb4e1dd1bd93e449dee8";
import {renderModelWorkbench} from "../model-workbench.js?v=609330a9305f060859d0eb4e1dd1bd93e449dee8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
