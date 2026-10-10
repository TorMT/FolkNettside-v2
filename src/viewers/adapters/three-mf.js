import {parse3MF} from "../../model/parsers/three-mf.js?v=dce8cb8ada3681d0e836ba70920c59bdec67b54b";
import {renderModelWorkbench} from "../model-workbench.js?v=dce8cb8ada3681d0e836ba70920c59bdec67b54b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
