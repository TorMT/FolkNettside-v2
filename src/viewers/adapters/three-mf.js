import {parse3MF} from "../../model/parsers/three-mf.js?v=96a91e1cce3fad30597988715d86bdab2e452e9e";
import {renderModelWorkbench} from "../model-workbench.js?v=96a91e1cce3fad30597988715d86bdab2e452e9e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
