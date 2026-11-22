import {parseSTL} from "../../model/parsers/stl.js?v=f792a704a2eea2aaeb4fea33ee311825c22112fb";
import {renderModelWorkbench} from "../model-workbench.js?v=f792a704a2eea2aaeb4fea33ee311825c22112fb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
