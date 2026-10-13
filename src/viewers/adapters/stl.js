import {parseSTL} from "../../model/parsers/stl.js?v=6d607086d97957cd2aad874d59cc9c70ebaac62b";
import {renderModelWorkbench} from "../model-workbench.js?v=6d607086d97957cd2aad874d59cc9c70ebaac62b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
