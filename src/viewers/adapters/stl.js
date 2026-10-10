import {parseSTL} from "../../model/parsers/stl.js?v=627ae2d7db15e18e7f95fa921d64287772170986";
import {renderModelWorkbench} from "../model-workbench.js?v=627ae2d7db15e18e7f95fa921d64287772170986";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
