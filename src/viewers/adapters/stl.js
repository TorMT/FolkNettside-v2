import {parseSTL} from "../../model/parsers/stl.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";
import {renderModelWorkbench} from "../model-workbench.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
