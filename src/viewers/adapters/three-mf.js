import {parse3MF} from "../../model/parsers/three-mf.js?v=86c67fd7ff6aa797cee2c00a2f48815856868088";
import {renderModelWorkbench} from "../model-workbench.js?v=86c67fd7ff6aa797cee2c00a2f48815856868088";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
