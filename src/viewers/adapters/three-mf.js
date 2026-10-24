import {parse3MF} from "../../model/parsers/three-mf.js?v=6b16ce2e1b358859d9ab7b80e670ae12b462f19f";
import {renderModelWorkbench} from "../model-workbench.js?v=6b16ce2e1b358859d9ab7b80e670ae12b462f19f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
