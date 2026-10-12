import {parse3MF} from "../../model/parsers/three-mf.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
import {renderModelWorkbench} from "../model-workbench.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
