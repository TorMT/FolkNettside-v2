import {parseSTL} from "../../model/parsers/stl.js?v=818367084c541a0e9acbf0eca557ac142d3e0563";
import {renderModelWorkbench} from "../model-workbench.js?v=818367084c541a0e9acbf0eca557ac142d3e0563";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
