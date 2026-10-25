import {parse3MF} from "../../model/parsers/three-mf.js?v=e3122517a76be2f71cc03c53138cb5526278a59e";
import {renderModelWorkbench} from "../model-workbench.js?v=e3122517a76be2f71cc03c53138cb5526278a59e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
