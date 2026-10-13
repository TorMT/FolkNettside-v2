import {parse3MF} from "../../model/parsers/three-mf.js?v=4ac28c6ea1cbe04a96e79bab0cf270d33945f140";
import {renderModelWorkbench} from "../model-workbench.js?v=4ac28c6ea1cbe04a96e79bab0cf270d33945f140";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
