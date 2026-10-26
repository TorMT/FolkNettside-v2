import {parseSTL} from "../../model/parsers/stl.js?v=9214b22b3345b780e50c71597f68f0d148af4659";
import {renderModelWorkbench} from "../model-workbench.js?v=9214b22b3345b780e50c71597f68f0d148af4659";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
