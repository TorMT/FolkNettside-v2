import {parseSTL} from "../../model/parsers/stl.js?v=0d23b69ef67722f06c8123b1f7c857375f4358b4";
import {renderModelWorkbench} from "../model-workbench.js?v=0d23b69ef67722f06c8123b1f7c857375f4358b4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
