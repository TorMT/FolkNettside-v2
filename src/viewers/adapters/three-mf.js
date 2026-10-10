import {parse3MF} from "../../model/parsers/three-mf.js?v=a49ec3fcd716b34053983faf366cd66ce526df47";
import {renderModelWorkbench} from "../model-workbench.js?v=a49ec3fcd716b34053983faf366cd66ce526df47";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
