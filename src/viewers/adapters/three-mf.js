import {parse3MF} from "../../model/parsers/three-mf.js?v=906d934ae3aa2b43c5d1f5bdc0422e6b2240cd78";
import {renderModelWorkbench} from "../model-workbench.js?v=906d934ae3aa2b43c5d1f5bdc0422e6b2240cd78";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
