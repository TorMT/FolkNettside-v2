import {parse3MF} from "../../model/parsers/three-mf.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
import {renderModelWorkbench} from "../model-workbench.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
