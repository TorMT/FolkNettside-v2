import {parseSTL} from "../../model/parsers/stl.js?v=6ec3e4445933c12c117ae3d707ac899695076c42";
import {renderModelWorkbench} from "../model-workbench.js?v=6ec3e4445933c12c117ae3d707ac899695076c42";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
