import {parse3MF} from "../../model/parsers/three-mf.js?v=b2da5ada6668a650d63b271c56da47a964332d82";
import {renderModelWorkbench} from "../model-workbench.js?v=b2da5ada6668a650d63b271c56da47a964332d82";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
