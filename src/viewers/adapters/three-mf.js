import {parse3MF} from "../../model/parsers/three-mf.js?v=c241949aa9e43c038d70642e616c579b97de2f48";
import {renderModelWorkbench} from "../model-workbench.js?v=c241949aa9e43c038d70642e616c579b97de2f48";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
