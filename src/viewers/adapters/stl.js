import {parseSTL} from "../../model/parsers/stl.js?v=e2b0753f00fbeca240493410ded24e84fbaca28c";
import {renderModelWorkbench} from "../model-workbench.js?v=e2b0753f00fbeca240493410ded24e84fbaca28c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
