import {parse3MF} from "../../model/parsers/three-mf.js?v=f064d871fe96dd79b72fe6613f0f3a5faa03c5b2";
import {renderModelWorkbench} from "../model-workbench.js?v=f064d871fe96dd79b72fe6613f0f3a5faa03c5b2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
