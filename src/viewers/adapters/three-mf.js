import {parse3MF} from "../../model/parsers/three-mf.js?v=34c1fc539fc56b9104d34c148e499ce0513cbce2";
import {renderModelWorkbench} from "../model-workbench.js?v=34c1fc539fc56b9104d34c148e499ce0513cbce2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
