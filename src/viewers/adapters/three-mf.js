import {parse3MF} from "../../model/parsers/three-mf.js?v=c31a0d930ade8837c9d0a52442369d82a6295e73";
import {renderModelWorkbench} from "../model-workbench.js?v=c31a0d930ade8837c9d0a52442369d82a6295e73";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
