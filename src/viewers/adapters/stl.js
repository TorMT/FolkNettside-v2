import {parseSTL} from "../../model/parsers/stl.js?v=06a87a720a94d806809ac49f022413be5bc79968";
import {renderModelWorkbench} from "../model-workbench.js?v=06a87a720a94d806809ac49f022413be5bc79968";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
