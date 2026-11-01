import {parseSTL} from "../../model/parsers/stl.js?v=31699fd9504dcf90e03825d504eed380d00e1645";
import {renderModelWorkbench} from "../model-workbench.js?v=31699fd9504dcf90e03825d504eed380d00e1645";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
