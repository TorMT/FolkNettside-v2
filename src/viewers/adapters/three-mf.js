import {parse3MF} from "../../model/parsers/three-mf.js?v=1a6e79a179cf3eb7de0bd0ca8920153fb3746b40";
import {renderModelWorkbench} from "../model-workbench.js?v=1a6e79a179cf3eb7de0bd0ca8920153fb3746b40";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
