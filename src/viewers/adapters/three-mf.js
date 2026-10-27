import {parse3MF} from "../../model/parsers/three-mf.js?v=5fc23607c75d81a4662f41e493ad84cb08256b91";
import {renderModelWorkbench} from "../model-workbench.js?v=5fc23607c75d81a4662f41e493ad84cb08256b91";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
