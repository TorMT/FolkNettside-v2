import {parse3MF} from "../../model/parsers/three-mf.js?v=c66930ad66a4c14777ba380d7dc50b8985b74d2f";
import {renderModelWorkbench} from "../model-workbench.js?v=c66930ad66a4c14777ba380d7dc50b8985b74d2f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
