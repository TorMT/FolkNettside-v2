import {parse3MF} from "../../model/parsers/three-mf.js?v=0f8d2c6055b25ada3f32ca51ca82a8cf9d3a5d09";
import {renderModelWorkbench} from "../model-workbench.js?v=0f8d2c6055b25ada3f32ca51ca82a8cf9d3a5d09";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
