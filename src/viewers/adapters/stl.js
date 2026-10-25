import {parseSTL} from "../../model/parsers/stl.js?v=92b98c24b6fbb18970d095d40d777ac5016d011d";
import {renderModelWorkbench} from "../model-workbench.js?v=92b98c24b6fbb18970d095d40d777ac5016d011d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
