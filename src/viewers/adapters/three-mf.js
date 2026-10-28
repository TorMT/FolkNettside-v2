import {parse3MF} from "../../model/parsers/three-mf.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";
import {renderModelWorkbench} from "../model-workbench.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
