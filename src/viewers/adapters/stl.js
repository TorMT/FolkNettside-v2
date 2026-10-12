import {parseSTL} from "../../model/parsers/stl.js?v=bd288256618fb1d442d52feec1b93e911ca6ab33";
import {renderModelWorkbench} from "../model-workbench.js?v=bd288256618fb1d442d52feec1b93e911ca6ab33";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
