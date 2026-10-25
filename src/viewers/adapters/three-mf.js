import {parse3MF} from "../../model/parsers/three-mf.js?v=1fff9a48acdb61912056574877967631693f4019";
import {renderModelWorkbench} from "../model-workbench.js?v=1fff9a48acdb61912056574877967631693f4019";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
