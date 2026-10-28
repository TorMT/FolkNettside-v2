import {parse3MF} from "../../model/parsers/three-mf.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";
import {renderModelWorkbench} from "../model-workbench.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
