import {parse3MF} from "../../model/parsers/three-mf.js?v=92f0f46d1bbd07b7e15687457f3de0dd24173dd2";
import {renderModelWorkbench} from "../model-workbench.js?v=92f0f46d1bbd07b7e15687457f3de0dd24173dd2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
