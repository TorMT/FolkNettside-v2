import {parseSTL} from "../../model/parsers/stl.js?v=a1e28fad9d52f0f7b7b9c365b9b14445df76c120";
import {renderModelWorkbench} from "../model-workbench.js?v=a1e28fad9d52f0f7b7b9c365b9b14445df76c120";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
