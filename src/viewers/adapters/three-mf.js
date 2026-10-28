import {parse3MF} from "../../model/parsers/three-mf.js?v=ba1fa47143fb4e2535ce35d37c43fe037e897fcf";
import {renderModelWorkbench} from "../model-workbench.js?v=ba1fa47143fb4e2535ce35d37c43fe037e897fcf";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
