import {parseSTL} from "../../model/parsers/stl.js?v=937e34621ee452dc7091ce15a05bd25e57218b52";
import {renderModelWorkbench} from "../model-workbench.js?v=937e34621ee452dc7091ce15a05bd25e57218b52";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
