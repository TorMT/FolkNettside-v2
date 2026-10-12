import {parse3MF} from "../../model/parsers/three-mf.js?v=0ccf53c6d4bc7c6d509311a1580b08f01ac569c9";
import {renderModelWorkbench} from "../model-workbench.js?v=0ccf53c6d4bc7c6d509311a1580b08f01ac569c9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
