import {parse3MF} from "../../model/parsers/three-mf.js?v=3643dc637ec1054f3ce0f476e0aed93821cc4109";
import {renderModelWorkbench} from "../model-workbench.js?v=3643dc637ec1054f3ce0f476e0aed93821cc4109";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
