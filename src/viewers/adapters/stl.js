import {parseSTL} from "../../model/parsers/stl.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";
import {renderModelWorkbench} from "../model-workbench.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
