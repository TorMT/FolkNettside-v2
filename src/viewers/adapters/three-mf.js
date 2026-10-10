import {parse3MF} from "../../model/parsers/three-mf.js?v=3d565bdfb8b32273c94de93df5ad784fd8378f5c";
import {renderModelWorkbench} from "../model-workbench.js?v=3d565bdfb8b32273c94de93df5ad784fd8378f5c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
