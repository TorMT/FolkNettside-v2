import {parseSTL} from "../../model/parsers/stl.js?v=8e80d2f316da68e351e1bf838a61f2f4d962c804";
import {renderModelWorkbench} from "../model-workbench.js?v=8e80d2f316da68e351e1bf838a61f2f4d962c804";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
