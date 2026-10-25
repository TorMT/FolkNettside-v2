import {parseSTL} from "../../model/parsers/stl.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
import {renderModelWorkbench} from "../model-workbench.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
