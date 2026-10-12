import {parseSTL} from "../../model/parsers/stl.js?v=90616dc45709175ba1c1aca73e4f6b14378857eb";
import {renderModelWorkbench} from "../model-workbench.js?v=90616dc45709175ba1c1aca73e4f6b14378857eb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
