import {parse3MF} from "../../model/parsers/three-mf.js?v=b12f77bd9f5bfbfaefe3e9fabba6a393250ab995";
import {renderModelWorkbench} from "../model-workbench.js?v=b12f77bd9f5bfbfaefe3e9fabba6a393250ab995";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
