import {parse3MF} from "../../model/parsers/three-mf.js?v=a6ca7f53d6adedc3a76ee5380dfed47d3e2a459b";
import {renderModelWorkbench} from "../model-workbench.js?v=a6ca7f53d6adedc3a76ee5380dfed47d3e2a459b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
