import {parseSTL} from "../../model/parsers/stl.js?v=fc57b9fb5c8d851efa745399aed4d164f60e2c96";
import {renderModelWorkbench} from "../model-workbench.js?v=fc57b9fb5c8d851efa745399aed4d164f60e2c96";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
