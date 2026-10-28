import {parseSTL} from "../../model/parsers/stl.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";
import {renderModelWorkbench} from "../model-workbench.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
