import {parseSTL} from "../../model/parsers/stl.js?v=5053d96772d88262e4d5bd2390f554a05635c376";
import {renderModelWorkbench} from "../model-workbench.js?v=5053d96772d88262e4d5bd2390f554a05635c376";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
