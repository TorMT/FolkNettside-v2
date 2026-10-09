import {parse3MF} from "../../model/parsers/three-mf.js?v=5fc1b305ac9f0c03373168e16c639aa66f439136";
import {renderModelWorkbench} from "../model-workbench.js?v=5fc1b305ac9f0c03373168e16c639aa66f439136";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
