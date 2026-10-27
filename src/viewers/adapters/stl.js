import {parseSTL} from "../../model/parsers/stl.js?v=5fc23607c75d81a4662f41e493ad84cb08256b91";
import {renderModelWorkbench} from "../model-workbench.js?v=5fc23607c75d81a4662f41e493ad84cb08256b91";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
