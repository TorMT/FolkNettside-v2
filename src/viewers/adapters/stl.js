import {parseSTL} from "../../model/parsers/stl.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {renderModelWorkbench} from "../model-workbench.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
