import {parse3MF} from "../../model/parsers/three-mf.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
import {renderModelWorkbench} from "../model-workbench.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
