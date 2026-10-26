import {parse3MF} from "../../model/parsers/three-mf.js?v=091329087a26af6a3b8817157dd7e4a7e90acebc";
import {renderModelWorkbench} from "../model-workbench.js?v=091329087a26af6a3b8817157dd7e4a7e90acebc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
