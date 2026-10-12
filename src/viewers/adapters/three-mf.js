import {parse3MF} from "../../model/parsers/three-mf.js?v=79586a975aa0b383788b1de8e40d9d0f17450156";
import {renderModelWorkbench} from "../model-workbench.js?v=79586a975aa0b383788b1de8e40d9d0f17450156";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
