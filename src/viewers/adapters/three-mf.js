import {parse3MF} from "../../model/parsers/three-mf.js?v=5fecac20c2ffd2b957604291819d35ca18740743";
import {renderModelWorkbench} from "../model-workbench.js?v=5fecac20c2ffd2b957604291819d35ca18740743";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
