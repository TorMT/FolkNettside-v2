import {parseSTL} from "../../model/parsers/stl.js?v=e886443c06d2d06973a5f2ae209a40e69b502a24";
import {renderModelWorkbench} from "../model-workbench.js?v=e886443c06d2d06973a5f2ae209a40e69b502a24";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
