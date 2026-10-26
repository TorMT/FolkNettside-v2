import {parse3MF} from "../../model/parsers/three-mf.js?v=926c03b74b4f91155d335575219cf17720aedde5";
import {renderModelWorkbench} from "../model-workbench.js?v=926c03b74b4f91155d335575219cf17720aedde5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
