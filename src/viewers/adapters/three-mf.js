import {parse3MF} from "../../model/parsers/three-mf.js?v=721741552196dbd597cff4d24b45ff2897fac691";
import {renderModelWorkbench} from "../model-workbench.js?v=721741552196dbd597cff4d24b45ff2897fac691";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
