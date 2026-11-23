import {parse3MF} from "../../model/parsers/three-mf.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";
import {renderModelWorkbench} from "../model-workbench.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
