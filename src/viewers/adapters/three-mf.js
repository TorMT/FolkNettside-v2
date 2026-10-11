import {parse3MF} from "../../model/parsers/three-mf.js?v=54824451a6ccb72220b24e9086340868292d7b5e";
import {renderModelWorkbench} from "../model-workbench.js?v=54824451a6ccb72220b24e9086340868292d7b5e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
