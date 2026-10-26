import {parseSTL} from "../../model/parsers/stl.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
import {renderModelWorkbench} from "../model-workbench.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
