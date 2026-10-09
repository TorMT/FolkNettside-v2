import {parse3MF} from "../../model/parsers/three-mf.js?v=c9ea8c067f9c93d09a5551a1f941bc460a51f21f";
import {renderModelWorkbench} from "../model-workbench.js?v=c9ea8c067f9c93d09a5551a1f941bc460a51f21f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
