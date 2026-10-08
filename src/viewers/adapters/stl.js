import {parseSTL} from "../../model/parsers/stl.js?v=b44fe4f85103fe31004a52a48bc4ae526f9d67be";
import {renderModelWorkbench} from "../model-workbench.js?v=b44fe4f85103fe31004a52a48bc4ae526f9d67be";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
