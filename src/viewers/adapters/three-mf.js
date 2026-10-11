import {parse3MF} from "../../model/parsers/three-mf.js?v=281a134882dfdb16ab44e478f1db78320090aa04";
import {renderModelWorkbench} from "../model-workbench.js?v=281a134882dfdb16ab44e478f1db78320090aa04";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
