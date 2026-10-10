import {parseSTL} from "../../model/parsers/stl.js?v=bb72b900cc676bef8d25a864e4fa8ed36aecce2c";
import {renderModelWorkbench} from "../model-workbench.js?v=bb72b900cc676bef8d25a864e4fa8ed36aecce2c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
