import {parse3MF} from "../../model/parsers/three-mf.js?v=6ec34516dd4fe9de4daef86e595944b88991d94f";
import {renderModelWorkbench} from "../model-workbench.js?v=6ec34516dd4fe9de4daef86e595944b88991d94f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
