import {parseSTL} from "../../model/parsers/stl.js?v=601223c3c0d25c29a81dbdc3a8a37af1838977bc";
import {renderModelWorkbench} from "../model-workbench.js?v=601223c3c0d25c29a81dbdc3a8a37af1838977bc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
