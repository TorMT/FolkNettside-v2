import {parseSTL} from "../../model/parsers/stl.js?v=006c7e6f7dcf9ff7d3ec52dcb41c83a07f2c2766";
import {renderModelWorkbench} from "../model-workbench.js?v=006c7e6f7dcf9ff7d3ec52dcb41c83a07f2c2766";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
