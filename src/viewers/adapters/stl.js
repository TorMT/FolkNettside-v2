import {parseSTL} from "../../model/parsers/stl.js?v=5ef8460bb35c24feff80ea8522df99edd4be06d8";
import {renderModelWorkbench} from "../model-workbench.js?v=5ef8460bb35c24feff80ea8522df99edd4be06d8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
