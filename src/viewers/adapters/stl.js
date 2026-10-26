import {parseSTL} from "../../model/parsers/stl.js?v=7e5797d31cff0963af5d9dffa467649e4ee3bed9";
import {renderModelWorkbench} from "../model-workbench.js?v=7e5797d31cff0963af5d9dffa467649e4ee3bed9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
