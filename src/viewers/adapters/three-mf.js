import {parse3MF} from "../../model/parsers/three-mf.js?v=fb1f3012a5633882a524abbb6feba0b215688eca";
import {renderModelWorkbench} from "../model-workbench.js?v=fb1f3012a5633882a524abbb6feba0b215688eca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
