import {parse3MF} from "../../model/parsers/three-mf.js?v=936b8d9a2a8de78d2df8067006848786331aae9f";
import {renderModelWorkbench} from "../model-workbench.js?v=936b8d9a2a8de78d2df8067006848786331aae9f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
