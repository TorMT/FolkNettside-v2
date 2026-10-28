import {parse3MF} from "../../model/parsers/three-mf.js?v=65d0c8e0f081dce644939afd1aabe4959c83ab95";
import {renderModelWorkbench} from "../model-workbench.js?v=65d0c8e0f081dce644939afd1aabe4959c83ab95";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
