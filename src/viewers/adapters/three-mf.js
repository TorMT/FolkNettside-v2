import {parse3MF} from "../../model/parsers/three-mf.js?v=4dd774bc5c727b2eb66e9af101a8f7f5d47f7e8b";
import {renderModelWorkbench} from "../model-workbench.js?v=4dd774bc5c727b2eb66e9af101a8f7f5d47f7e8b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
