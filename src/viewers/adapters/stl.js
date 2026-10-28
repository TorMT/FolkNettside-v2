import {parseSTL} from "../../model/parsers/stl.js?v=ff65360f8997e54d67031643faf6320badda39f8";
import {renderModelWorkbench} from "../model-workbench.js?v=ff65360f8997e54d67031643faf6320badda39f8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
