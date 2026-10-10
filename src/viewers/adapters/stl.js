import {parseSTL} from "../../model/parsers/stl.js?v=8b92531d6c727bcd20457bb92f32ffbd2772ec7e";
import {renderModelWorkbench} from "../model-workbench.js?v=8b92531d6c727bcd20457bb92f32ffbd2772ec7e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
