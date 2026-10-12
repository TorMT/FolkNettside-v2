import {parse3MF} from "../../model/parsers/three-mf.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {renderModelWorkbench} from "../model-workbench.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
