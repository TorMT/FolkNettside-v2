import {parseSTL} from "../../model/parsers/stl.js?v=71b3ca353c744cd3b6167899f0c6c190d53e8df1";
import {renderModelWorkbench} from "../model-workbench.js?v=71b3ca353c744cd3b6167899f0c6c190d53e8df1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
