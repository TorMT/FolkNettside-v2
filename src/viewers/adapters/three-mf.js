import {parse3MF} from "../../model/parsers/three-mf.js?v=173c85abf1c25435b1726bca261b48e2887a0d8b";
import {renderModelWorkbench} from "../model-workbench.js?v=173c85abf1c25435b1726bca261b48e2887a0d8b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
