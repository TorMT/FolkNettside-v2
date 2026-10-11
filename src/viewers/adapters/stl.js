import {parseSTL} from "../../model/parsers/stl.js?v=3c10f5129a02a9c4c488ae499bcc7672dab50d59";
import {renderModelWorkbench} from "../model-workbench.js?v=3c10f5129a02a9c4c488ae499bcc7672dab50d59";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
