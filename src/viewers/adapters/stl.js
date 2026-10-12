import {parseSTL} from "../../model/parsers/stl.js?v=1fc73ec8f1ab395a398b566fd8d523b50485fb25";
import {renderModelWorkbench} from "../model-workbench.js?v=1fc73ec8f1ab395a398b566fd8d523b50485fb25";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
