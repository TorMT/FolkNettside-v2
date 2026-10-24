import {parseSTL} from "../../model/parsers/stl.js?v=4aa94acaeec75ab673386c3874388162ceb8bb15";
import {renderModelWorkbench} from "../model-workbench.js?v=4aa94acaeec75ab673386c3874388162ceb8bb15";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
