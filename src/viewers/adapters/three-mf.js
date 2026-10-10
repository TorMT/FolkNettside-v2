import {parse3MF} from "../../model/parsers/three-mf.js?v=d86376fc586a93008f11020d8ea835b5296dce7b";
import {renderModelWorkbench} from "../model-workbench.js?v=d86376fc586a93008f11020d8ea835b5296dce7b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
