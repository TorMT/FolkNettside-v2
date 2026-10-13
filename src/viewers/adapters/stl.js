import {parseSTL} from "../../model/parsers/stl.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {renderModelWorkbench} from "../model-workbench.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
