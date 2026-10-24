import {parseSTL} from "../../model/parsers/stl.js?v=55d6f2d38b7d295fcbb16c26f03c5943ed0fac15";
import {renderModelWorkbench} from "../model-workbench.js?v=55d6f2d38b7d295fcbb16c26f03c5943ed0fac15";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
