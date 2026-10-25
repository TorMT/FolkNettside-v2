import {parseSTL} from "../../model/parsers/stl.js?v=802f1c6e9008ae03de65a5e5893eee1fe75df6a3";
import {renderModelWorkbench} from "../model-workbench.js?v=802f1c6e9008ae03de65a5e5893eee1fe75df6a3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
