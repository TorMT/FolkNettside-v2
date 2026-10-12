import {parse3MF} from "../../model/parsers/three-mf.js?v=2542cb51ad49a595d985f3bd5ec42db298c97f5c";
import {renderModelWorkbench} from "../model-workbench.js?v=2542cb51ad49a595d985f3bd5ec42db298c97f5c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
