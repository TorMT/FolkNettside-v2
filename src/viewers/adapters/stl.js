import {parseSTL} from "../../model/parsers/stl.js?v=7ee86019f1e9b68eeba453bde0b80597c74bc725";
import {renderModelWorkbench} from "../model-workbench.js?v=7ee86019f1e9b68eeba453bde0b80597c74bc725";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
