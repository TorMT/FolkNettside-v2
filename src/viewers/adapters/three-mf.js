import {parse3MF} from "../../model/parsers/three-mf.js?v=00b50d48be5befc84b237bb477aea9f35b9fe3ba";
import {renderModelWorkbench} from "../model-workbench.js?v=00b50d48be5befc84b237bb477aea9f35b9fe3ba";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
