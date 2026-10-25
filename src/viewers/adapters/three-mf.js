import {parse3MF} from "../../model/parsers/three-mf.js?v=38e5521b493efa1ecb00d8234c2c73404d780039";
import {renderModelWorkbench} from "../model-workbench.js?v=38e5521b493efa1ecb00d8234c2c73404d780039";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
