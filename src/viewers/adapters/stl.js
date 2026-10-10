import {parseSTL} from "../../model/parsers/stl.js?v=9bf8435c998032db93e884790ca38463e6459db6";
import {renderModelWorkbench} from "../model-workbench.js?v=9bf8435c998032db93e884790ca38463e6459db6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
