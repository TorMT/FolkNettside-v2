import {parseSTL} from "../../model/parsers/stl.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
import {renderModelWorkbench} from "../model-workbench.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
