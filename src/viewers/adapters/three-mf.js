import {parse3MF} from "../../model/parsers/three-mf.js?v=ba349c176139a69567cab11f2e814e2115b29fd4";
import {renderModelWorkbench} from "../model-workbench.js?v=ba349c176139a69567cab11f2e814e2115b29fd4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
