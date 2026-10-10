import {parseSTL} from "../../model/parsers/stl.js?v=0f844debfa3e429b17d85efc8470bb32b5a6e51c";
import {renderModelWorkbench} from "../model-workbench.js?v=0f844debfa3e429b17d85efc8470bb32b5a6e51c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
