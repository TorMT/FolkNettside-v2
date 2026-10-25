import {parseSTL} from "../../model/parsers/stl.js?v=8b49ea5672be889a82061af1e83bb5b35874e331";
import {renderModelWorkbench} from "../model-workbench.js?v=8b49ea5672be889a82061af1e83bb5b35874e331";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
