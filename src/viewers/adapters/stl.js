import {parseSTL} from "../../model/parsers/stl.js?v=4a530622b0d7917db6334fb59707dd53283b4fa1";
import {renderModelWorkbench} from "../model-workbench.js?v=4a530622b0d7917db6334fb59707dd53283b4fa1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
