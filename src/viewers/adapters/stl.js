import {parseSTL} from "../../model/parsers/stl.js?v=f7b8422ed3178def3b4139899d7c3ef4bf555e08";
import {renderModelWorkbench} from "../model-workbench.js?v=f7b8422ed3178def3b4139899d7c3ef4bf555e08";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
