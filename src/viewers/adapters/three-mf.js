import {parse3MF} from "../../model/parsers/three-mf.js?v=b2469ea3ea62fe23f80a6609903a1d6eb27adbcd";
import {renderModelWorkbench} from "../model-workbench.js?v=b2469ea3ea62fe23f80a6609903a1d6eb27adbcd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
