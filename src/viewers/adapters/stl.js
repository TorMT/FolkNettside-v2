import {parseSTL} from "../../model/parsers/stl.js?v=301cd1ad39956f18bcf1f2a01b695f2c42a9d89f";
import {renderModelWorkbench} from "../model-workbench.js?v=301cd1ad39956f18bcf1f2a01b695f2c42a9d89f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
