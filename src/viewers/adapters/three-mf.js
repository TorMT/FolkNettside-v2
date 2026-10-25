import {parse3MF} from "../../model/parsers/three-mf.js?v=cdf26ac02bd6c907cd4360cb6c5c131a53649d39";
import {renderModelWorkbench} from "../model-workbench.js?v=cdf26ac02bd6c907cd4360cb6c5c131a53649d39";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
