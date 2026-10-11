import {parseSTL} from "../../model/parsers/stl.js?v=db4ff2cd274a67b85dc07eff9102584337c9234e";
import {renderModelWorkbench} from "../model-workbench.js?v=db4ff2cd274a67b85dc07eff9102584337c9234e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
