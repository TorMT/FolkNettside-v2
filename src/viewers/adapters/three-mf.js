import {parse3MF} from "../../model/parsers/three-mf.js?v=0afd31dcd08a2722e0d4df5a45729a42aef30087";
import {renderModelWorkbench} from "../model-workbench.js?v=0afd31dcd08a2722e0d4df5a45729a42aef30087";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
