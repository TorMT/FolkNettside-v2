import {parseSTL} from "../../model/parsers/stl.js?v=a253d9848b629224c815865c8c97172a5e55748c";
import {renderModelWorkbench} from "../model-workbench.js?v=a253d9848b629224c815865c8c97172a5e55748c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
