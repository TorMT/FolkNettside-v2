import {parseSTL} from "../../model/parsers/stl.js?v=271f5805bc4a8f562cdce7a026fa3e125aa5b023";
import {renderModelWorkbench} from "../model-workbench.js?v=271f5805bc4a8f562cdce7a026fa3e125aa5b023";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
