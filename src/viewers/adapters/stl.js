import {parseSTL} from "../../model/parsers/stl.js?v=2dd92f45b41433755fece77d39899c6632e50f66";
import {renderModelWorkbench} from "../model-workbench.js?v=2dd92f45b41433755fece77d39899c6632e50f66";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
