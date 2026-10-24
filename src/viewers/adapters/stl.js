import {parseSTL} from "../../model/parsers/stl.js?v=ec6ef139c245139fd99e91dae698640f3ac5c559";
import {renderModelWorkbench} from "../model-workbench.js?v=ec6ef139c245139fd99e91dae698640f3ac5c559";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
