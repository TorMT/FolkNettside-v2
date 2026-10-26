import {parseSTL} from "../../model/parsers/stl.js?v=5b96d06e305aee0848639bf4863c1f9759641cf3";
import {renderModelWorkbench} from "../model-workbench.js?v=5b96d06e305aee0848639bf4863c1f9759641cf3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
