import {parse3MF} from "../../model/parsers/three-mf.js?v=d0d5d42501a65af993688ac13345f9fcdc28162c";
import {renderModelWorkbench} from "../model-workbench.js?v=d0d5d42501a65af993688ac13345f9fcdc28162c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
