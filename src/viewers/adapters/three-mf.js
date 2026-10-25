import {parse3MF} from "../../model/parsers/three-mf.js?v=cd1af15d73caa05c0b416a1fabed555ac3f55bd2";
import {renderModelWorkbench} from "../model-workbench.js?v=cd1af15d73caa05c0b416a1fabed555ac3f55bd2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
