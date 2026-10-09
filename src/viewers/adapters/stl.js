import {parseSTL} from "../../model/parsers/stl.js?v=fe44a8109849da7e0a1ca20e2c80b3e4154d4193";
import {renderModelWorkbench} from "../model-workbench.js?v=fe44a8109849da7e0a1ca20e2c80b3e4154d4193";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
