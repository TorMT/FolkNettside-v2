import {parseSTL} from "../../model/parsers/stl.js?v=13aa5b706807694568c59ee42c3eca4a70e87723";
import {renderModelWorkbench} from "../model-workbench.js?v=13aa5b706807694568c59ee42c3eca4a70e87723";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
