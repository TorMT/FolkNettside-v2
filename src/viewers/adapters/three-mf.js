import {parse3MF} from "../../model/parsers/three-mf.js?v=0f2c46fb5407953a6027ee84752684d80ac98516";
import {renderModelWorkbench} from "../model-workbench.js?v=0f2c46fb5407953a6027ee84752684d80ac98516";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
