import {parseSTL} from "../../model/parsers/stl.js?v=cdc3b8279451be0393b272f30c592494eedb5690";
import {renderModelWorkbench} from "../model-workbench.js?v=cdc3b8279451be0393b272f30c592494eedb5690";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
