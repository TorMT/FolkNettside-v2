import {parse3MF} from "../../model/parsers/three-mf.js?v=6b2348c5628eaef4869fdb2678154509d0b3bafa";
import {renderModelWorkbench} from "../model-workbench.js?v=6b2348c5628eaef4869fdb2678154509d0b3bafa";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
