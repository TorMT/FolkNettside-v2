import {parse3MF} from "../../model/parsers/three-mf.js?v=ef95b2aedf9f22b01c3903332b5ed0f2d2d4e4af";
import {renderModelWorkbench} from "../model-workbench.js?v=ef95b2aedf9f22b01c3903332b5ed0f2d2d4e4af";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
