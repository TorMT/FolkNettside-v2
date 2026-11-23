import {parseSTL} from "../../model/parsers/stl.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {renderModelWorkbench} from "../model-workbench.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
