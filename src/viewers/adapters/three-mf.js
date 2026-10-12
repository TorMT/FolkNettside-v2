import {parse3MF} from "../../model/parsers/three-mf.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";
import {renderModelWorkbench} from "../model-workbench.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
