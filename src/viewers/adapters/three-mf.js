import {parse3MF} from "../../model/parsers/three-mf.js?v=d36dcc2bb7d1eadca7dd9211a34a85cea60f3c91";
import {renderModelWorkbench} from "../model-workbench.js?v=d36dcc2bb7d1eadca7dd9211a34a85cea60f3c91";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
