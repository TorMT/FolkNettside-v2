import {parseSTL} from "../../model/parsers/stl.js?v=34c856425d735c952487452c7415b4966dae7ac1";
import {renderModelWorkbench} from "../model-workbench.js?v=34c856425d735c952487452c7415b4966dae7ac1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
