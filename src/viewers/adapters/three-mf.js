import {parse3MF} from "../../model/parsers/three-mf.js?v=9214b22b3345b780e50c71597f68f0d148af4659";
import {renderModelWorkbench} from "../model-workbench.js?v=9214b22b3345b780e50c71597f68f0d148af4659";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
