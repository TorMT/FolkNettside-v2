import {parse3MF} from "../../model/parsers/three-mf.js?v=b25b2e7c5ff5b3ee51c96d9681194894d167489f";
import {renderModelWorkbench} from "../model-workbench.js?v=b25b2e7c5ff5b3ee51c96d9681194894d167489f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
