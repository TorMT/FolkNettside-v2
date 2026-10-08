import {parseSTL} from "../../model/parsers/stl.js?v=5d3b7e74c647e4c2c90043ead7e407cde35dd9f8";
import {renderModelWorkbench} from "../model-workbench.js?v=5d3b7e74c647e4c2c90043ead7e407cde35dd9f8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
