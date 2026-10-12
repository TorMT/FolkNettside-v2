import {parseSTL} from "../../model/parsers/stl.js?v=a920f76a71f5bf0a9129b860814fef1d69b696b2";
import {renderModelWorkbench} from "../model-workbench.js?v=a920f76a71f5bf0a9129b860814fef1d69b696b2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
