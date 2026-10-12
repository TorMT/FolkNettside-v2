import {parseSTL} from "../../model/parsers/stl.js?v=a6ca7f53d6adedc3a76ee5380dfed47d3e2a459b";
import {renderModelWorkbench} from "../model-workbench.js?v=a6ca7f53d6adedc3a76ee5380dfed47d3e2a459b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
