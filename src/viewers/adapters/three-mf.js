import {parse3MF} from "../../model/parsers/three-mf.js?v=3a2d1f6057e8d2cb943bf65844a4bd8c00c919ae";
import {renderModelWorkbench} from "../model-workbench.js?v=3a2d1f6057e8d2cb943bf65844a4bd8c00c919ae";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
