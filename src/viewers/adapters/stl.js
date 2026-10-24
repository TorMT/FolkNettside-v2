import {parseSTL} from "../../model/parsers/stl.js?v=146aa4b23c60ca46c03bae09422af4f02f92a568";
import {renderModelWorkbench} from "../model-workbench.js?v=146aa4b23c60ca46c03bae09422af4f02f92a568";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
