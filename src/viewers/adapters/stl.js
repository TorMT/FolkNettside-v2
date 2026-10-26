import {parseSTL} from "../../model/parsers/stl.js?v=16905756e8ca0c03b44e439a98d4a14270553414";
import {renderModelWorkbench} from "../model-workbench.js?v=16905756e8ca0c03b44e439a98d4a14270553414";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
