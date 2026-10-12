import {parse3MF} from "../../model/parsers/three-mf.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
import {renderModelWorkbench} from "../model-workbench.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
