import {parse3MF} from "../../model/parsers/three-mf.js?v=beaeb2e206df47a1e4b682cf783ef701ba5390f4";
import {renderModelWorkbench} from "../model-workbench.js?v=beaeb2e206df47a1e4b682cf783ef701ba5390f4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
