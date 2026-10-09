import {parse3MF} from "../../model/parsers/three-mf.js?v=5e763f2ce07324d38c9a287cf3b76d2bb7447b30";
import {renderModelWorkbench} from "../model-workbench.js?v=5e763f2ce07324d38c9a287cf3b76d2bb7447b30";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
