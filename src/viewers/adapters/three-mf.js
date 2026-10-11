import {parse3MF} from "../../model/parsers/three-mf.js?v=c7d3fea039731151b509ab0835d2f32708518698";
import {renderModelWorkbench} from "../model-workbench.js?v=c7d3fea039731151b509ab0835d2f32708518698";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
