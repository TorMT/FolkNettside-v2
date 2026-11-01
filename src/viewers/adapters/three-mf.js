import {parse3MF} from "../../model/parsers/three-mf.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
import {renderModelWorkbench} from "../model-workbench.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
