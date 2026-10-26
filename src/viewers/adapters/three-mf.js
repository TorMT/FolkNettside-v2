import {parse3MF} from "../../model/parsers/three-mf.js?v=9e915a2606f9faf3200b5685423c5d2906bd284a";
import {renderModelWorkbench} from "../model-workbench.js?v=9e915a2606f9faf3200b5685423c5d2906bd284a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
