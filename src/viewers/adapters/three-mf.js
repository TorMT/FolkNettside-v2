import {parse3MF} from "../../model/parsers/three-mf.js?v=e843d668948dc608b7eaefa073bc4895a7f7df6a";
import {renderModelWorkbench} from "../model-workbench.js?v=e843d668948dc608b7eaefa073bc4895a7f7df6a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
