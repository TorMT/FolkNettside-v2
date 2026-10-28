import {parseSTL} from "../../model/parsers/stl.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {renderModelWorkbench} from "../model-workbench.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
